import mongoose from "mongoose";
const opts = { timestamps: true, strict: true };
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { ...opts, collection: "admins" },
);
const profileSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    title: { type: String, maxlength: 160 },
    intro: { type: String, maxlength: 2000 },
    photo: String,
    resume: String,
    email: { type: String, lowercase: true },
    location: String,
    socialLinks: [
      {
        label: { type: String, maxlength: 60 },
        url: { type: String, maxlength: 500 },
      },
    ],
  },
  { ...opts, collection: "profiles" },
);
const aboutSchema = new mongoose.Schema(
  { content: { type: String, maxlength: 10000, default: "" } },
  { ...opts, collection: "abouts" },
);
const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
  },
  opts,
);
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 5000 },
    techStack: [String],
    image: String,
    github: String,
    live: String,
  },
  opts,
);
const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    organization: { type: String, maxlength: 160 },
    description: { type: String, maxlength: 5000 },
    startDate: String,
    endDate: String,
  },
  opts,
);
const educationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    institution: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 3000 },
    startDate: String,
    endDate: String,
  },
  opts,
);
const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    organization: { type: String, maxlength: 160 },
    description: { type: String, maxlength: 3000 },
    image: String,
    url: String,
    date: String,
  },
  opts,
);
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    read: { type: Boolean, default: false },
  },
  { ...opts, collection: "messages" },
);
export const Admin =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export const Profile =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);
export const About =
  mongoose.models.About || mongoose.model("About", aboutSchema);
export const Skill =
  mongoose.models.Skill || mongoose.model("Skill", skillSchema);
export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
export const Experience =
  mongoose.models.Experience || mongoose.model("Experience", experienceSchema);
export const Education =
  mongoose.models.Education || mongoose.model("Education", educationSchema);
export const Certificate =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", certificateSchema);
export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
