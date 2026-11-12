varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;
// 1.0 for premultiplied textures (default), 0.0 for 'no-premultiply-alpha'
uniform float uPremultiplyAlpha;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;

    // see the WGSL particle shader: restore straight color for the npm blend modes
    // so the source alpha is not applied twice.
    if (uPremultiplyAlpha < 0.5 && color.a > 0.0)
    {
        color = vec4(color.rgb / color.a, color.a);
    }

    gl_FragColor = color;
}
