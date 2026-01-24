import { defineField, defineType } from "sanity";

const duration = defineType({
  name: "duration",
  title: "Duration",
  type: "object",
  fields: [
    defineField({ name: "value", title: "Value", type: "number" }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      options: {
        list: [
          { title: "sec", value: "sec" },
          { title: "min", value: "min" },
          { title: "hr", value: "hr" },
        ],
      },
    }),
  ],
});

const setEntry = defineType({
  name: "setEntry",
  title: "Set Entry",
  type: "object",
  fields: [
    defineField({ name: "weight", title: "Weight", type: "number" }),
    defineField({ name: "reps", title: "Reps", type: "number" }),
    defineField({ name: "rpe", title: "RPE", type: "number" }),
    defineField({ name: "actualReps", title: "Actual Reps", type: "number" }),
    defineField({ name: "actualDuration", title: "Actual Duration (min)", type: "number" }),
    defineField({ name: "duration", title: "Duration", type: "duration" }),
  ],
});

const exerciseEntry = defineType({
  name: "exerciseEntry",
  title: "Exercise Entry",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({
      name: "sessionId",
      title: "Session",
      type: "reference",
      to: [{ type: "session" }],
    }),
    defineField({
      name: "exerciseId",
      title: "Exercise",
      type: "reference",
      to: [{ type: "exercise" }],
    }),
    defineField({
      name: "sets",
      title: "Sets",
      type: "array",
      of: [{ type: "setEntry" }],
    }),
  ],
});

const session = defineType({
  name: "session",
  title: "Session",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({
      name: "day",
      title: "Day",
      type: "string",
      options: {
        list: [
          { title: "Monday", value: "Monday" },
          { title: "Tuesday", value: "Tuesday" },
          { title: "Wednesday", value: "Wednesday" },
          { title: "Thursday", value: "Thursday" },
          { title: "Friday", value: "Friday" },
          { title: "Saturday", value: "Saturday" },
          { title: "Sunday", value: "Sunday" },
        ],
      },
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      options: {
        list: [
          { title: "AM", value: "AM" },
          { title: "PM", value: "PM" },
        ],
      },
    }),
    defineField({ name: "label", title: "Label", type: "string" }),
  ],
});

const week = defineType({
  name: "week",
  title: "Week",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({ name: "startDate", title: "Start Date", type: "date" }),
    defineField({ name: "endDate", title: "End Date", type: "date" }),
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({
      name: "sessions",
      title: "Sessions",
      type: "array",
      of: [{ type: "reference", to: [{ type: "session" }] }],
    }),
  ],
});

const macroGoals = defineType({
  name: "macroGoals",
  title: "Macro Goals",
  type: "object",
  fields: [
    defineField({ name: "protein", title: "Protein", type: "number" }),
    defineField({ name: "carbs", title: "Carbs", type: "number" }),
    defineField({ name: "fat", title: "Fat", type: "number" }),
    defineField({ name: "calories", title: "Calories", type: "number" }),
  ],
});

const macroPercents = defineType({
  name: "macroPercents",
  title: "Macro Percents",
  type: "object",
  fields: [
    defineField({ name: "protein", title: "Protein", type: "number" }),
    defineField({ name: "carbs", title: "Carbs", type: "number" }),
    defineField({ name: "fat", title: "Fat", type: "number" }),
  ],
});

const nutritionDay = defineType({
  name: "nutritionDay",
  title: "Nutrition Day",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "macroGoals", title: "Macro Goals", type: "macroGoals" }),
    defineField({ name: "macroPercents", title: "Macro Percents", type: "macroPercents" }),
  ],
});

const meal = defineType({
  name: "meal",
  title: "Meal",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({
      name: "dayId",
      title: "Nutrition Day",
      type: "reference",
      to: [{ type: "nutritionDay" }],
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Breakfast", value: "Breakfast" },
          { title: "Lunch", value: "Lunch" },
          { title: "Dinner", value: "Dinner" },
          { title: "Snack", value: "Snack" },
        ],
      },
    }),
    defineField({ name: "macros", title: "Macros", type: "macroGoals" }),
  ],
});

const planExercise = defineType({
  name: "planExercise",
  title: "Plan Exercise",
  type: "object",
  fields: [
    defineField({
      name: "exerciseId",
      title: "Exercise",
      type: "reference",
      to: [{ type: "exercise" }],
    }),
    defineField({ name: "sets", title: "Sets", type: "number" }),
    defineField({ name: "reps", title: "Reps", type: "number" }),
    defineField({ name: "duration", title: "Duration", type: "duration" }),
  ],
});

const planSession = defineType({
  name: "planSession",
  title: "Plan Session",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({
      name: "exercises",
      title: "Exercises",
      type: "array",
      of: [{ type: "planExercise" }],
    }),
  ],
});

const planDay = defineType({
  name: "planDay",
  title: "Plan Day",
  type: "object",
  fields: [
    defineField({ name: "day", title: "Day", type: "string" }),
    defineField({
      name: "sessions",
      title: "Sessions",
      type: "array",
      of: [{ type: "planSession" }],
    }),
  ],
});

const plan = defineType({
  name: "plan",
  title: "Plan",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Lightweight / Getting Started", value: "Lightweight / Getting Started" },
          { title: "Minimal Equipment (Van Life)", value: "Minimal Equipment (Van Life)" },
          { title: "Gym Membership (Van + Gym)", value: "Gym Membership (Van + Gym)" },
        ],
      },
    }),
    defineField({ name: "description", title: "Description", type: "string" }),
    defineField({
      name: "chart",
      title: "Chart",
      type: "array",
      of: [{ type: "planDay" }],
    }),
    defineField({
      name: "pdfs",
      title: "PDF Documents",
      type: "array",
      of: [{ type: "reference", to: [{ type: "planPdf" }] }],
    }),
  ],
});

const planPdf = defineType({
  name: "planPdf",
  title: "Plan PDF",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "format", title: "Format", type: "string" }),
    defineField({ name: "description", title: "Description", type: "string" }),
    defineField({ name: "buyButtonProductId", title: "Buy Button Product ID", type: "string" }),
    defineField({ name: "file", title: "PDF File", type: "file" }),
    defineField({
      name: "previewImage",
      title: "Preview Image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
});

const exercise = defineType({
  name: "exercise",
  title: "Exercise",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }), // name
    defineField({ name: "isCustom", title: "Is this custom? (Did a user create this?)", type: "string" }), // name
    defineField({ name: "image", title: "Image", type: "url" }),
    defineField({ name: "description", title: "Description", type: "string" }), // instructions augmented
    defineField({ name: "safety", title: "Safety", type: "string" }),
    defineField({ name: "muscle", title: "Muscle", type: "string" }),
     defineField({
      name: "equipments",
      title: "Equipments",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "type",
      title: "difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Expert", value: "expert" },
        ],
      },
    }),
    defineField({
      name: "source",
      title: "Source of Exercise",
      type: "string",
      options: {
        list: [
          { title: "API", value: "api" },
          { title: "custom", value: "custom" },
        ],
      },
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Strength", value: "Strength" },
          { title: "Cardio", value: "Cardio" },
          { title: "Yoga", value: "Yoga" },
          { title: "Warmup", value: "Warmup" }, // stretching
          { title: "Core", value: "Core" }, // plyometrics
          { title: "Olympic Weightlifting", value: "OlympicWeightLifting" },
          // { title: "Plyometrics", value: "Plyometrics" },
          { title: "Power Lifting", value: "PowerLifting" },
          // { title: "Stretching", value: "Stretching" },
          { title: "Strongman", value: "Strongman" },
        ],
      },
    }),
    defineField({
      name: "yogaCategory",
      title: "Yoga Category",
      type: "string",
      options: {
        list: [
          { title: "10 min quick session", value: "10 min quick session" },
          { title: "Balance", value: "Balance" },
          { title: "Stretch", value: "Stretch" },
          { title: "Flow", value: "Flow" },
          { title: "Flow on the go", value: "Flow on the go" },
          { title: "Abs", value: "Abs" },
          { title: "Recovery", value: "Recovery" },
          { title: "Core", value: "Core" },
        ],
      },
    }),
  ],
});

const affiliatePromotion = defineType({
  name: "affiliatePromotion",
  title: "Affiliate Promotion",
  type: "document",
  fields: [
    defineField({ name: "cta", title: "CTA", type: "string" }),
    defineField({ name: "url", title: "URL", type: "url" }),
    defineField({ name: "qrCodeUrl", title: "QR Code URL", type: "url" }),
    defineField({ name: "disclosure", title: "Disclosure", type: "string" }),
    defineField({ name: "copy", title: "Copy", type: "string" }),
  ],
});

const progressEntry = defineType({
  name: "progressEntry",
  title: "Progress Entry",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "weight", title: "Weight (lbs)", type: "number" }),
    defineField({
      name: "coverPhoto",
      title: "Cover Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [{ type: "image" }],
      options: { layout: "grid" },
    }),
    defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
  ],
});

const userProfile = defineType({
  name: "userProfile",
  title: "User Profile",
  type: "document",
  fields: [
    defineField({ name: "userId", title: "User ID", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "firebaseUid", title: "Firebase UID", type: "string" }),
    defineField({ name: "displayName", title: "Display Name", type: "string" }),
    defineField({ name: "photoURL", title: "Photo URL", type: "url" }),
    defineField({ name: "goalCalories", title: "Goal Calories", type: "number" }),
    defineField({ name: "macroPercents", title: "Macro Percents", type: "macroPercents" }),
    defineField({
      name: "purchasedPdfs",
      title: "Purchased PDFs",
      type: "array",
      of: [{ type: "reference", to: [{ type: "planPdf" }] }],
    }),
    defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
    defineField({ name: "updatedAt", title: "Updated At", type: "datetime" }),
  ],
});

export const schemaTypes = [
  duration,
  setEntry,
  exerciseEntry,
  session,
  week,
  macroGoals,
  macroPercents,
  nutritionDay,
  meal,
  planExercise,
  planSession,
  planDay,
  plan,
  planPdf,
  exercise,
  affiliatePromotion,
  progressEntry,
  userProfile,
];
