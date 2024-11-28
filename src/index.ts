import { promises as fs, existsSync } from "fs";
import { JSDOM } from "jsdom";
import { exec } from "child_process";
import { Command } from "commander";
import { promisify } from "util";

const execAsync = promisify(exec);

const program = new Command();

program.argument("<svgFile>", "Path to the SVG file").parse(process.argv);

const [svgFile] = program.args;

if (!svgFile) {
  console.error("Error: Please provide the SVG file path.");
  process.exit(1);
}

if (!existsSync(svgFile)) {
  console.error(`Error: File "${svgFile}" does not exist.`);
  process.exit(1);
}

// Read and parse the SVG file
const svgContent = await fs.readFile(svgFile, "utf-8");
const jsdomInstance = new JSDOM("");
const domParser = new jsdomInstance.window.DOMParser();
const document = domParser.parseFromString(svgContent, "image/svg+xml");

// Find all <image> elements with data URLs
const images = document.querySelectorAll("image");
await Promise.all(
  [...images].map(async (img) => {
    let usedAttribute = "xlink:href";
    let href = img.getAttribute("xlink:href");
    if (!href) {
      usedAttribute = "href";
      href = img.getAttribute("href");
    }
    if (
      href &&
      (href.startsWith("data:image/png") ||
        href.startsWith("data:image/gif") ||
        href.startsWith("data:image/jpg"))
    ) {
      console.log(`Found image: ${href.slice(0, 50)}...`);

      // Extract image data from the data URL
      const [header, base64Data] = href.split(",");
      const extension = header.match(/image\/(png|gif|jpg)/)?.[1];
      if (!extension) return;

      const inputFileName = `temp-${randomString()}.${extension}`;
      const outputFileName = `temp-${randomString()}.webp`;

      // Write the base64 data to a temporary file
      await fs.writeFile(inputFileName, Buffer.from(base64Data, "base64"));

      // Convert the image to WebP using ImageMagick
      await execAsync(
        `magick convert ${inputFileName} -quality 90 ${outputFileName}`,
      );

      // Read the WebP file and convert it back to a data URL
      const webpData = await fs.readFile(outputFileName);
      const webpDataUrl = `data:image/webp;base64,${webpData.toString("base64")}`;

      // Update the image href with the new data URL
      img.setAttribute(usedAttribute, webpDataUrl);

      // Clean up temporary files
      await fs.unlink(inputFileName);
      await fs.unlink(outputFileName);

      console.log("Converted and updated image to WebP data URL.");
    }
  }),
);

// Write the updated SVG content to a new file
const newFileName = svgFile.replace(/\.svg$/, ".small.svg");
await fs.writeFile(newFileName, document.documentElement.outerHTML);
console.log(`Updated SVG saved to "${newFileName}"`);

function randomString() {
  return (Math.random() * 2e17).toString(36);
}
