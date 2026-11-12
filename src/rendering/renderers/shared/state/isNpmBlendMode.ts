import type { BLEND_MODES } from './const';

/**
 * Tells whether a blend mode is one of the non premultiplied (`*-npm`) variants.
 *
 * Those blend modes are only selected for textures whose `alphaMode` is
 * `no-premultiply-alpha` (see {@link getAdjustedBlendModeBlend}). They blend with
 * `SRC_ALPHA` and therefore expect straight (non premultiplied) color output.
 * @param blendMode - the (already adjusted) blend mode of a batch
 * @returns true when the blend mode is an `*-npm` variant
 * @internal
 */
export function isNpmBlendMode(blendMode: BLEND_MODES): boolean
{
    return blendMode.endsWith('-npm');
}
