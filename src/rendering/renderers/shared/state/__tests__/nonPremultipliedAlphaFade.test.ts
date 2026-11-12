import '~/scene/graphics/init';
import '~/rendering/init';
import { describeLocalOnly, getWebGLRenderer, getWebGPURenderer } from '@test-utils';
import { ImageSource, RenderTexture, Texture } from '~/rendering';
import { Container, Sprite } from '~/scene';

import type { ALPHA_MODES } from '~/rendering/renderers/shared/texture/const';
import type { Renderer } from '~/rendering/renderers/types';

// size of the solid white texture used by every sprite
const TEXTURE_SIZE = 8;

// a white, fully opaque texture. Its source is uploaded either premultiplied or straight
function createWhiteTexture(alphaMode: ALPHA_MODES): Texture
{
    const canvas = document.createElement('canvas');

    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    return new Texture({
        source: new ImageSource({
            resource: canvas,
            alphaMode,
        }),
    });
}

function pixelAt(pixels: Uint8Array | Uint8ClampedArray, width: number, x: number, y: number): number[]
{
    const offset = ((y * width) + x) * 4;

    return Array.from(pixels.subarray(offset, offset + 4));
}

/**
 * Renders a white sprite with the given vertex alpha over an opaque white backdrop and
 * reads back the center pixel. A correct fade over white keeps the rgb channels at 255
 * regardless of the alpha mode; a double application of alpha darkens the rgb channels.
 * @param getRenderer - factory for the renderer backend under test
 * @param alphaMode - the texture alpha mode
 * @param spriteAlpha - the sprite's world alpha
 */
async function renderFadePixel(
    getRenderer: () => Promise<Renderer>,
    alphaMode: ALPHA_MODES,
    spriteAlpha: number
): Promise<number[]>
{
    const renderer = await getRenderer();

    try
    {
        const target = RenderTexture.create({ width: 32, height: 32 });

        const stage = new Container();

        // opaque white backdrop so any rgb darkening is visible against it
        const backdrop = new Sprite(Texture.WHITE);

        backdrop.width = 32;
        backdrop.height = 32;

        const sprite = new Sprite(createWhiteTexture(alphaMode));

        sprite.width = TEXTURE_SIZE;
        sprite.height = TEXTURE_SIZE;
        sprite.x = 12;
        sprite.y = 12;
        sprite.alpha = spriteAlpha;

        stage.addChild(backdrop, sprite);

        renderer.render({ container: stage, target, clear: true });

        const { pixels, width } = renderer.extract.pixels(target);

        return pixelAt(pixels, width, 16, 16);
    }
    finally
    {
        renderer.destroy();
    }
}

function fadeSuite(name: string, getRenderer: () => Promise<Renderer>, run: typeof describe | typeof describe.skip): void
{
    run(`non premultiplied alpha fade (${name})`, () =>
    {
        it('keeps the color straight while a non premultiplied sprite fades out', async () =>
        {
            // 0.5 alpha over a white backdrop: rgb must stay white, only coverage changes
            const [r, g, b, a] = await renderFadePixel(getRenderer, 'no-premultiply-alpha', 0.5);

            expect(a).toBe(255);
            // the bug produced 1 - a + a^2 => ~191 instead of 255
            expect([r, g, b]).toEqual([255, 255, 255]);
        });

        it('matches the premultiplied texture result at every fade step', async () =>
        {
            const alphas = [1, 0.75, 0.5, 0.25, 0.1];

            for (const alpha of alphas)
            {
                const npmPixel = await renderFadePixel(getRenderer, 'no-premultiply-alpha', alpha);
                const pmaPixel = await renderFadePixel(getRenderer, 'premultiplied-alpha', alpha);

                expect(npmPixel).toEqual(pmaPixel);
            }
        });

        it('is fully opaque and white when alpha is 1 for both modes', async () =>
        {
            const npmPixel = await renderFadePixel(getRenderer, 'no-premultiply-alpha', 1);
            const pmaPixel = await renderFadePixel(getRenderer, 'premultiplied-alpha', 1);

            expect(npmPixel).toEqual([255, 255, 255, 255]);
            expect(pmaPixel).toEqual([255, 255, 255, 255]);
        });
    });
}

// WebGL runs everywhere; WebGPU only where a device is available (skipped on CI via describeLocalOnly)
fadeSuite('WebGL', () => getWebGLRenderer({ width: 32, height: 32 }), describe);
fadeSuite('WebGPU', () => getWebGPURenderer({ width: 32, height: 32 }), describeLocalOnly);
