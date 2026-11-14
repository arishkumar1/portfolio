const definitions = {
  profile: {
    name: 120,
    title: 160,
    intro: 2000,
    photo: 2000,
    resume: 2000,
    email: 200,
    location: 200,
    socialLinks: "socialLinks",
  },
  about: { content: 10000 },
  skills: { name: 100, category: 100, level: "level" },
  projects: {
    title: 160,
    description: 5000,
    techStack: "techStack",
    image: 2000,
    github: 500,
    live: 500,
  },
  experience: {
    title: 160,
    organization: 160,
    description: 5000,
    startDate: 40,
    endDate: 40,
  },
  education: {
    title: 160,
    institution: 200,
    description: 3000,
    startDate: 40,
    endDate: 40,
  },
  certificates: {
    title: 200,
    organization: 160,
    description: 3000,
    image: 2000,
    url: 500,
    date: 40,
  },
  messages: { name: 100, email: 200, content: 5000 },
};

const requiredFields = {
  skills: ["name", "category"],
  projects: ["title"],
  experience: ["title"],
  education: ["title"],
  certificates: ["title"],
  messages: ["name", "email", "content"],
};

function validUrl(value, { allowContact = false, allowAssetPath = false } = {}) {
  if (!value) return true;
  if (allowAssetPath && /^\/(?:uploads\/[^/]+|api\/media\/[a-f\d]{24})$/i.test(value))
    return true;
  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(value)
      ? new URL(value)
      : new URL(`https://${value}`);
    if (["http:", "https:"].includes(candidate.protocol)) return true;
    return allowContact && ["mailto:", "tel:"].includes(candidate.protocol);
  } catch {
    return false;
  }
}

function fail(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function validateObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail("Invalid request data");
  for (const key of Object.keys(body)) {
    if (key.startsWith("$") || key.includes(".") || key === "__proto__")
      fail("Invalid request data");
  }
}

function validateResource(resource, body, { partial = false } = {}) {
  validateObject(body);
  const definition = definitions[resource];
  if (!definition) fail("Invalid request data");

  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(definition, key)) fail("Unknown field");
  }
  if (!partial) {
    for (const key of requiredFields[resource] || []) {
      if (typeof body[key] !== "string" || !body[key].trim())
        fail(`${key} is required`);
    }
  }

  const normalized = {};
  for (const [key, value] of Object.entries(body)) {
    const rule = definition[key];
    if (rule === "level") {
      if (![
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
      ].includes(value))
        fail("Invalid skill level");
      normalized[key] = value;
      continue;
    }
    if (rule === "techStack") {
      if (
        !Array.isArray(value) ||
        value.length > 30 ||
        value.some((item) => typeof item !== "string" || item.length > 80)
      )
        fail("Invalid technology list");
      normalized[key] = value.map((item) => item.trim()).filter(Boolean);
      continue;
    }
    if (rule === "socialLinks") {
      if (!Array.isArray(value) || value.length > 15) fail("Invalid social links");
      normalized[key] = value.map((item) => {
        validateObject(item);
        if (
          Object.keys(item).some((field) => !["label", "url"].includes(field)) ||
          typeof item.label !== "string" ||
          typeof item.url !== "string" ||
          item.label.trim().length > 60 ||
          item.url.trim().length > 500 ||
          !validUrl(item.url.trim(), { allowContact: true })
        )
          fail("Invalid social link");
        return { label: item.label.trim(), url: item.url.trim() };
      });
      continue;
    }
    if (typeof value !== "string") fail(`Invalid ${key}`);
    const text = value.trim();
    if (text.length > rule) fail(`${key} is too long`);
    if (key === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
      fail("Invalid email address");
    if (["photo", "resume", "image"].includes(key) && !validUrl(text, { allowAssetPath: true }))
      fail(`Invalid ${key} URL`);
    if (["github", "live", "url"].includes(key) && !validUrl(text))
      fail(`Invalid ${key} URL`);
    normalized[key] = text;
  }
  return normalized;
}

export function validateResourceBody(resource, options) {
  return (req, res, next) => {
    try {
      req.body = validateResource(resource, req.body, options);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validatePasswordChange(req, res, next) {
  try {
    validateObject(req.body);
    const { currentPassword, newPassword } = req.body;
    if (
      Object.keys(req.body).some(
        (key) => !["currentPassword", "newPassword"].includes(key),
      ) ||
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 12 ||
      newPassword.length > 128
    )
      fail("Invalid password change request");
    next();
  } catch (error) {
    next(error);
  }
}
