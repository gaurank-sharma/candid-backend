
// const mongoose = require("mongoose");

// const PostSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   slug: { type: String, required: true, unique: true },
//   heroImage: { type: String }, // top banner
//   author: { type: String, default: "Candid Team" },
//   date: { type: Date, default: Date.now },
//   sections: [
//     {
//       text: String,
//       image: String, // optional
//     },
//   ],
// });

// module.exports = mongoose.model("Post", PostSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true, // Slugs should be unique
    },
    heroImage: {
      type: String, // This will be a URL from Cloudinary
      default: '',
    },
    sections: [
      {
        text: {
          type: String,
          required: true,
        },
        image: {
          type: String, // This will also be a URL
          default: '',
        },
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming your user model is named 'User'
    },
  },
  {
    // This automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', PostSchema);
