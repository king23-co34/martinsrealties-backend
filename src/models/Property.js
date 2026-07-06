const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
    },
    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['apartment', 'house', 'duplex', 'bungalow', 'land', 'office', 'shortlet', 'other'],
    },
    listingType: {
      type: String,
      required: [true, 'Listing type is required'],
      enum: ['sale', 'rent', 'shortlet'],
      default: 'sale',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    bedrooms: { type: Number, default: 0, min: 0 },
    bathrooms: { type: Number, default: 0, min: 0 },
    areaSqft: { type: Number, min: 0 },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    amenities: [{ type: String, trim: true }],
    images: [imageSchema],
    status: {
      type: String,
      enum: ['available', 'pending', 'sold', 'rented'],
      default: 'available',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

propertySchema.index({ title: 'text', description: 'text', city: 'text', state: 'text' });
propertySchema.index({ price: 1 });
propertySchema.index({ city: 1, state: 1 });
propertySchema.index({ status: 1, listingType: 1, type: 1 });

module.exports = mongoose.model('Property', propertySchema);
