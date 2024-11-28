# Super hacky minification of images in svgs

Most tools that minify svgs don't minify the images in the svgs. This finds all gifs, jpgs and pngs inlined into an SVG and makes them into WEBPs. You must have imagemagick installed.

Example image gets reduced from 6.1MB to 785KB without any visible quality loss.


Mostly GPT written probably super flawed but works in my one case test images.


Example usage:

```bash
yarn # Only needed once to install dependencies
yarn start path/to/image.svg
```
