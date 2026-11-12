/** @internal */
export const colorBit = {
    name: 'color-bit',
    vertex: {
        header: /* wgsl */`
            @in aColor: vec4<f32>;
        `,
        main: /* wgsl */`
            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);
        `
    },
    fragment: {
        header: /* wgsl */`
            struct AlphaModeUniforms {
                // 1.0 when the batch textures are premultiplied (the default),
                // 0.0 when they use 'no-premultiply-alpha' and the *-npm blend modes.
                uPremultiplyAlpha: f32,
            }

            @group(3) @binding(0) var<uniform> alphaModeUniforms : AlphaModeUniforms;
        `,
        end: /* wgsl */`
            // vColor and the texture are combined as premultiplied color above.
            // A non premultiplied texture is blended with SRC_ALPHA instead of ONE,
            // so it needs straight color output: undo the premultiplication here
            // rather than applying the source alpha a second time (which darkens
            // semi transparent sprites while fading).
            if (alphaModeUniforms.uPremultiplyAlpha < 0.5 && finalColor.a > 0.0)
            {
                finalColor = vec4<f32>(finalColor.rgb / finalColor.a, finalColor.a);
            }
        `
    }
};

/** @internal */
export const colorBitGl = {
    name: 'color-bit',
    vertex: {
        header: /* glsl */`
            in vec4 aColor;
        `,
        main: /* glsl */`
            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);
        `
    },
    fragment: {
        header: /* glsl */`
            // 1.0 for premultiplied textures (default), 0.0 for 'no-premultiply-alpha'
            uniform float uPremultiplyAlpha;
        `,
        end: /* glsl */`
            // see the WGSL color bit: restore straight color for the npm blend modes
            // so the source alpha is not applied twice.
            if (uPremultiplyAlpha < 0.5 && finalColor.a > 0.0)
            {
                finalColor = vec4(finalColor.rgb / finalColor.a, finalColor.a);
            }
        `
    }
};
