import fs from "fs";
import { JSDOM } from "jsdom";
import { execSync } from "child_process";
import { Command } from "commander";

const program = new Command();

program.argument("<svgFile>", "Path to the SVG file").parse(process.argv);

const [svgFile] = program.args;

if (!svgFile) {
  console.error("Error: Please provide the SVG file path.");
  process.exit(1);
}

if (!fs.existsSync(svgFile)) {
  console.error(`Error: File "${svgFile}" does not exist.`);
  process.exit(1);
}

try {
  // Read and parse the SVG file
  const svgContent = fs.readFileSync(svgFile, "utf-8");
  const dom = new JSDOM(svgContent);
  const document = dom.window.document;

  // Find all <image> elements with data URLs
  const images = document.querySelectorAll("image");
  images.forEach((img) => {
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

      const inputFileName = `temp.${extension}`;
      const outputFileName = `temp.webp`;

      // Write the base64 data to a temporary file
      fs.writeFileSync(inputFileName, Buffer.from(base64Data, "base64"));

      // Convert the image to WebP using ImageMagick
      execSync(`magick convert ${inputFileName} ${outputFileName}`);

      // Read the WebP file and convert it back to a data URL
      const webpData = fs.readFileSync(outputFileName);
      const webpDataUrl = `data:image/webp;base64,${webpData.toString("base64")}`;

      // Update the image href with the new data URL
      img.setAttribute(usedAttribute, webpDataUrl);

      // Clean up temporary files
      fs.unlinkSync(inputFileName);
      fs.unlinkSync(outputFileName);

      console.log("Converted and updated image to WebP data URL.");
    }
  });

  // Write the updated SVG content to a new file
  const newFileName = svgFile.replace(/\.svg$/, ".small.svg");
  fs.writeFileSync(newFileName, dom.serialize());
  console.log(`Updated SVG saved to "${newFileName}"`);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
