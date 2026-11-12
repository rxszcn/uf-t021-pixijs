import { UniformGroup } from '../shader/UniformGroup';

/**
 * The resource name of the uniform group that carries the alpha mode of the textures
 * currently being drawn. Shaders use it to decide whether the color they output has
 * to be premultiplied:
 *
 * - `uPremultiplyAlpha = 1` for premultiplied textures (the default, PMA blend modes)
 * - `uPremultiplyAlpha = 0` for `no-premultiply-alpha` textures (the `*-npm` blend
 *   modes, which expect straight color output)
 *
 * The value is per batch: the batcher breaks whenever the adjusted blend mode changes,
 * so every draw of one batch shares the same alpha mode.
 * @internal
 */
export const ALPHA_MODE_UNIFORM_NAME = 'alphaModeUniforms';

/**
 * Creates a uniform group holding a single `uPremultiplyAlpha` flag.
 * A fresh, non static group is returned so each shader / batch adaptor can update the
 * flag per draw without invalidating shared bind groups.
 * @returns a uniform group containing `uPremultiplyAlpha`
 * @internal
 */
export function getAlphaModeUniformGroup(): UniformGroup<{
    uPremultiplyAlpha: { value: number; type: 'f32' }
}>
{
    return new UniformGroup({
        uPremultiplyAlpha: { value: 1, type: 'f32' },
    });
}
