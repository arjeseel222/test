import {Cloudinary} from "@cloudinary/url-gen";

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'dnm9gjbqm' // Your cloud name from Cloudinary dashboard
  }
});

// Example: Generate an image URL with transformations
const createImageUrl = (publicId) => {
  return cld.image(publicId)
    .format('auto')
    .quality('auto')
    .toURL();
}