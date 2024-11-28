# Convert inlined images in SVGs to WEBP

Most tools that minify svgs don't minify the images in the svgs. This finds all gifs, jpgs and pngs inlined into an SVG and makes them into WEBPs. You must have imagemagick, nodejs and yarn installed.

Example image gets reduced from 6.1MB to 785KB without any visible quality loss.

Mostly GPT written probably super flawed but works on my test images.

Example usage:

```bash
brew install node yarn imagemagick
git clone https://github.com/danieltroger/webp-in-svg.git
cd webp-in-svg
yarn # This and above is only needed once to install dependencies
yarn start path/to/image.svg
```
