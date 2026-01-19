// Nomadic Gym Life – Mobile-First Fitness Tracker & Preset Plan App
// All theme tokens, GlobalStyle, and styled components are inline. No external CSS or theme imports.
// All data is loaded from the inline CMS database (see db.json).
// All React components include data-component attributes.
// Animation uses css helper from styled-components.

import React, { useState } from "react";
import styled, { createGlobalStyle, css } from "styled-components";

// ---- THEME TOKENS ----
const theme = {
  colors: {
    primary: "#3E4C59",
    accent: "#FFB400",
    accent2: "#F25F5C",
    background: "#F7F7F7",
    card: "#FFF",
    success: "#43AA8B",
    danger: "#F25F5C",
    text: "#222",
    textSecondary: "#666",
    border: "#E0E0E0",
    navBg: "#3E4C59",
    navText: "#FFF",
    navShadow: "rgba(62,76,89,0.04)",
    navActive: "#FFB400",
  },
  font: {
    family: "'Inter', sans-serif",
    heading: "bold 1.25rem/1.2 'Inter', sans-serif",
    body: "normal 1rem/1.6 'Inter', sans-serif",
    button: "bold 1rem/1.2 'Inter', sans-serif",
  },
  radii: {
    card: "16px",
    input: "12px",
    button: "24px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  shadow: {
    card: "0 2px 8px rgba(62,76,89,0.08)",
    nav: "0 2px 8px rgba(62,76,89,0.04)",
    navBottom: "0 -2px 8px rgba(62,76,89,0.04)",
  },
  input: {
    height: "48px",
    padding: "12px",
  },
  z: {
    nav: 10,
    modal: 100,
  },
};

// ---- GLOBAL STYLE ----
const GlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    background: ${theme.colors.background};
    font-family: ${theme.font.family};
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  input, button, select, textarea {
    font-family: inherit;
    font-size: 1rem;
    outline: none;
  }
  a {
    color: ${theme.colors.accent};
    text-decoration: none;
  }
`;

// ---- ANIMATION ----
const fadeIn = css`
  opacity: 0;
  transform: translateY(16px);
  animation: fadeIn 0.3s forwards;
  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ---- STYLED COMPONENTS ----
const AppBar = styled.header.attrs({ 'data-component': 'AppBar' })`
  background: ${theme.colors.navBg};
  color: ${theme.colors.navText};
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing.md};
  box-shadow: ${theme.shadow.nav};
  position: sticky;
  top: 0;
  z-index: ${theme.z.nav};
`;
const AppLogo = styled.div.attrs({ 'data-component': 'AppLogo' })`
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
  flex: 1;
`;
const AppNav = styled.nav.attrs({ 'data-component': 'AppNav' })`
  display: flex;
  gap: ${theme.spacing.md};
`;
const NavTab = styled.button.attrs(props => ({
  'data-component': 'NavTab',
  'aria-label': props['aria-label'],
  'aria-current': props.active ? 'page' : undefined,
}))`
  background: none;
  color: ${props => props.active ? theme.colors.navActive : theme.colors.navText};
  border: none;
  font: ${theme.font.button};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.radii.button};
  cursor: pointer;
  transition: color 0.2s;
  &:hover, &:focus {
    color: ${theme.colors.accent};
    outline: 2px solid ${theme.colors.accent};
  }
`;
const Main = styled.main.attrs({ 'data-component': 'Main' })`
  padding: ${theme.spacing.md};
  max-width: 480px;
  margin: 0 auto 72px auto;
`;
const Section = styled.section.attrs(props => ({ 'data-component': props['data-component'] || 'Section' }))`
  margin-bottom: ${theme.spacing.lg};
  ${fadeIn}
`;
const Card = styled.div.attrs(props => ({ 'data-component': props['data-component'] || 'Card' }))`
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;
const SectionTitle = styled.h2.attrs({ 'data-component': 'SectionTitle' })`
  font: ${theme.font.heading};
  color: ${theme.colors.primary};
  margin: 0 0 ${theme.spacing.sm} 0;
`;
const Button = styled.button.attrs(props => ({ 'data-component': props['data-component'] || 'Button' }))`
  background: ${props => props.variant === 'secondary' ? 'transparent' : theme.colors.accent};
  color: ${props => props.variant === 'secondary' ? theme.colors.primary : theme.colors.text};
  border: ${props => props.variant === 'secondary' ? `2px solid ${theme.colors.primary}` : 'none'};
  border-radius: ${theme.radii.button};
  font: ${theme.font.button};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  cursor: pointer;
  min-width: 120px;
  margin: ${theme.spacing.xs};
  box-shadow: ${theme.shadow.card};
  transition: background 0.2s, color 0.2s;
  &:hover, &:focus {
    background: ${theme.colors.accent2};
    color: #fff;
    outline: 2px solid ${theme.colors.accent2};
  }
`;
const Input = styled.input.attrs({ 'data-component': 'Input' })`
  width: 100%;
  height: ${theme.input.height};
  padding: ${theme.input.padding};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.input};
  font: ${theme.font.body};
  margin-bottom: ${theme.spacing.sm};
  &:focus {
    border: 2px solid ${theme.colors.accent};
    outline: none;
  }
`;
const Label = styled.label.attrs({ 'data-component': 'Label' })`
  font-size: 1rem;
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xs};
  display: block;
`;
const ModalOverlay = styled.div.attrs({ 'data-component': 'ModalOverlay' })`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(62,76,89,0.24);
  z-index: ${theme.z.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Modal = styled.div.attrs({ 'data-component': 'Modal' })`
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.lg};
  min-width: 320px;
  max-width: 90vw;
  ${fadeIn}
`;
const BottomNav = styled.nav.attrs({ 'data-component': 'BottomNav' })`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: ${theme.colors.card};
  box-shadow: ${theme.shadow.navBottom};
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  z-index: ${theme.z.nav};
`;
const BottomNavTab = styled.button.attrs(props => ({
  'data-component': 'BottomNavTab',
  'aria-label': props['aria-label'],
  'aria-current': props.active ? 'page' : undefined,
}))`
  background: none;
  border: none;
  color: ${props => props.active ? theme.colors.navActive : theme.colors.primary};
  font-size: 1.2rem;
  padding: ${theme.spacing.sm};
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  &:hover, &:focus {
    color: ${theme.colors.accent2};
    outline: 2px solid ${theme.colors.accent2};
  }
`;
const Icon = styled.span.attrs({ 'data-component': 'Icon' })`
  font-size: 1.3rem;
  margin-bottom: 2px;
`;

// ---- MOCK CMS DATABASE (see db.json for full data) ----
const db = {
  weeks: [
    {
      id: "week1",
      startDate: "2024-06-10",
      endDate: "2024-06-16",
      label: "Week 1",
      sessions: [
        // Each day has AM/PM sessions
        { id: "s1", weekId: "week1", day: "Monday", time: "AM", label: "Yoga Core", entries: [
          { id: "e1", sessionId: "s1", exerciseId: "ex6", sets: [{ weight: 0, reps: 0, rpe: 6, duration: 30, durationUnits: "min" },] },
        ] },
        { id: "s2", weekId: "week1", day: "Monday", time: "PM", label: "Warmup", entries: [
            { id: "e2", sessionId: "s2", exerciseId: "ex7", sets: [{ weight: 0, reps: 10, rpe: 0 },] },
            { id: "e3", sessionId: "s2", exerciseId: "ex8", sets: [{ weight: 0, reps: 10, rpe: 0 },] },
            { id: "e4", sessionId: "s2", exerciseId: "ex10", sets: [{ weight: 0, reps: 10, rpe: 0 },] },
            { id: "e5", sessionId: "s2", exerciseId: "ex11", sets: [{ weight: 0, reps: 10, rpe: 0 },] },
            { id: "e6", sessionId: "s2", exerciseId: "ex12", sets: [{ weight: 0, reps: 10, rpe: 0 },] },
        ] },
        { id: "s3", weekId: "week1", day: "Monday", time: "PM", label: "Calestenics", entries: [
            { id: "e2", sessionId: "s3", exerciseId: "ex21", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e3", sessionId: "s3", exerciseId: "ex22", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e4", sessionId: "s3", exerciseId: "ex23", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e5", sessionId: "s3", exerciseId: "ex24", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e6", sessionId: "s3", exerciseId: "ex25", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e7", sessionId: "s3", exerciseId: "ex26", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e7", sessionId: "s3", exerciseId: "ex27", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
            { id: "e7", sessionId: "s3", exerciseId: "ex28", sets: [{ weight: 0, reps: 30, rpe: 0 },] },
        ] },
      ],
    },
  ],
  nutritionDays: [
    {
      id: "nd1",
      date: "2024-06-10",
      macroGoals: { protein: 120, carbs: 200, fat: 60, calories: 1800 },
      meals: [
        { id: "m1", dayId: "nd1", type: "Breakfast", macros: { protein: 25, carbs: 40, fat: 10, calories: 350 } },
        { id: "m2", dayId: "nd1", type: "Lunch", macros: { protein: 35, carbs: 60, fat: 15, calories: 500 } },
        { id: "m3", dayId: "nd1", type: "Dinner", macros: { protein: 40, carbs: 70, fat: 20, calories: 600 } },
        { id: "m4", dayId: "nd1", type: "Snack", macros: { protein: 10, carbs: 30, fat: 8, calories: 200 } },
      ],
    },
  ],
  plans: [
    {
      id: "p1",
      title: "Lightweight / Getting Started",
      category: "Lightweight / Getting Started",
      description: "Yoga and basic strength for beginners.",
      chart: [
        { day: "Monday", sessions: [
          { label: "Yoga – 10 min quick session", exercises: [ { exerciseId: "ex3", sets: 1, reps: 0, duration: 10 } ] },
          { label: "Strength – Push Ups", exercises: [ { exerciseId: "ex1", sets: 3, reps: 10 } ] },
        ] },
        { day: "Tuesday", sessions: [
          { label: "Yoga – Flow", exercises: [ { exerciseId: "ex4", sets: 1, reps: 0, duration: 15 } ] },
        ] },
      ],
    },
    {
      id: "p2",
      title: "Minimal Equipment (Van Life)",
      category: "Minimal Equipment (Van Life)",
      description: "Bodyweight and resistance band routines.",
      chart: [
        { day: "Monday", sessions: [
          { label: "Bodyweight Circuit", exercises: [ { exerciseId: "ex2", sets: 3, reps: 15 } ] },
        ] },
      ],
    },
    {
      id: "p3",
      title: "Gym Membership (Van + Gym)",
      category: "Gym Membership (Van + Gym)",
      description: "Full gym training with yoga recovery.",
      chart: [
        { day: "Monday", sessions: [
          { label: "Barbell Squat", exercises: [ { exerciseId: "ex5", sets: 4, reps: 8 } ] },
          { label: "Yoga – Recovery", exercises: [ { exerciseId: "ex4", sets: 1, duration: 20 } ] },
        ] },
      ],
    },
  ],
  exerciseLibrary: [
    {
      id: "ex1",
      title: "Push Up",
      description: "Classic bodyweight push up. Hands shoulder-width, core tight.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
      type: "Strength",
      yogaCategory: null,
    },
    {
      id: "ex2",
      title: "Squat",
      description: "Bodyweight squat. Feet shoulder-width, back straight.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Strength",
      yogaCategory: null,
    },
    {
      id: "ex3",
      title: "Yoga – 10 min quick session",
      description: "Short yoga flow for flexibility and mobility.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048972.png",
      type: "Yoga",
      yogaCategory: "10 min quick session",
    },
    {
      id: "ex4",
      title: "Yoga – Flow",
      description: "Continuous yoga movement for balance and strength.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048973.png",
      type: "Yoga",
      yogaCategory: "Flow",
    },
    {
      id: "ex6",
      title: "Yoga – Core",
      description: "Yoga that focuses on strengthening the core.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048973.png",
      type: "Yoga",
      yogaCategory: "Core",
    },
    {
      id: "ex7",
      title: "Barbell Squat",
      description: "Weighted squat for lower body strength.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Strength",
      yogaCategory: null,
    },
    {
      id: "ex8",
      title: "Standing Knee Hugs",
      description: "Yoga type balance by alternating standing on each leg and then pulling the leg into the chest for stretch.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Warmup",
      yogaCategory: null,
    },
    {
      id: "ex9",
      title: "Standing Quad Stretches",
      description: "Standing Quad Stretches w/overhead reach.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Warmup",
      yogaCategory: null,
    },
    {
      id: "ex10",
      title: "Step back Hamstring stretch",
      description: "Yoga style stretch where the motion is stepping backwards into a hamstring stretch.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Warmup",
      yogaCategory: null,
    },
    {
      id: "ex11",
      title: "Prone/Plank to low lunge rotation",
      description: "Prone position to low lunge rotation.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Warmup",
      yogaCategory: null,
    },
    {
      id: "ex12",
      title: "Windmill Stretch",
      description: "Alternating Windmill Stretch from vertical starfish to right hand to left foot.",
      image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
      type: "Warmup",
      yogaCategory: null,
    },
    {
  id: "ex21",
  title: "Seated Sprinter Crunch",
  description: "From a seated position, drive one knee toward the chest while rotating the opposite elbow across the body in a sprinting motion.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex22",
  title: "Arm High Crunch",
  description: "Lying on your back with arms extended overhead, perform a crunch while keeping arms straight to increase core tension.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex23",
  title: "Seated Flutter Kicks",
  description: "From a seated lean-back position, alternate straight-leg kicks while keeping the core braced and chest lifted.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex24",
  title: "Scissor Kicks",
  description: "Lying on your back, alternate straight-leg lifts in a scissoring motion while keeping the lower back pressed into the floor.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex25",
  title: "Arm-Leg Raises",
  description: "From a supine position, raise opposite arm and leg simultaneously while maintaining core stability.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex26",
  title: "Plank Crunch",
  description: "From a high plank, draw one knee toward the chest under control, alternating sides while keeping hips stable.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
},
{
  id: "ex27",
  title: "Medicine Ball Mountain Climbers",
  description: "Hands on a medicine ball in plank position, alternate driving knees toward the chest for added instability and core engagement.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Conditioning",
  yogaCategory: null,
},
{
  id: "ex28",
  title: "Side Plank Crunch",
  description: "From a side plank position, bring the top knee toward the elbow while maintaining a straight line through the body.",
  image: "https://cdn-icons-png.flaticon.com/512/1048/1048962.png",
  type: "Core",
  yogaCategory: null,
}
  ],
  affiliatePromotions: [
    {
      cta: "Get $1/month at Planet Fitness",
      url: "https://www.planetfitness.com/affiliate?ref=nomadicgymlife",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.planetfitness.com/affiliate?ref=nomadicgymlife",
      disclosure: "Affiliate link: I receive a benefit if you sign up.",
      copy: "We could hit the gym together. This link gets you a $1 month at Planet Fitness — and I receive an affiliate benefit if you sign up.",
    }
  ]
};

// ---- UTILS ----
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sessionTimes = ["AM", "PM"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const macroKeys = ["protein", "carbs", "fat", "calories"];
const planCategories = [
  "Lightweight / Getting Started",
  "Minimal Equipment (Van Life)",
  "Gym Membership (Van + Gym)",
];
const yogaCategories = [
  "10 min quick session",
  "30 min core",
  "Balance",
  "Stretch",
  "Flow",
  "Flow on the go",
  "Abs",
  "Recovery",
];

// ---- APP ----
function App() {
  // Navigation state
  const [tab, setTab] = useState(0); // 0:Tracker, 1:Nutrition, 2:Plans, 3:Library, 4:Promo

  // Tracker state
  const [selectedWeek, setSelectedWeek] = useState(db.weeks[0].id);
  const [sessionModal, setSessionModal] = useState(null); // { session, day, time }

  // Nutrition state
  const [selectedDay, setSelectedDay] = useState(db.nutritionDays[0].id);

  // Plans state
  const [planCategory, setPlanCategory] = useState(planCategories[0]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ---- Tracker Section ----
  function renderTracker() {
    const week = db.weeks.find(w => w.id === selectedWeek);
    return (
      <Section data-component="FitnessTracker">
        <SectionTitle>Fitness Tracker</SectionTitle>
        <Card data-component="WeekSelector">
          <Label htmlFor="week-select">Select Week</Label>
          <select
            id="week-select"
            data-component="WeekSelect"
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 8 }}
          >
            {db.weeks.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </Card>
        <Card data-component="WeekGrid">
          <table data-component="WeekTable" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr data-component="WeekTableHead">
                <th data-component="WeekTableHeadCell"></th>
                {sessionTimes.map(t => (
                  <th key={t} data-component="WeekTableHeadCell">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map(day => (
                <tr key={day} data-component="WeekTableRow">
                  <td data-component="WeekTableDayCell" style={{ fontWeight: 600 }}>{day}</td>
                  {sessionTimes.map(time => {
                    const session = week.sessions.find(s => s.day === day && s.time === time);
                    return (
                      <td
                        key={time}
                        data-component="WeekTableSessionCell"
                        style={{ padding: 4 }}
                      >
                        <Button
                          data-component="SessionCellButton"
                          variant={session && session.entries.length > 0 ? "primary" : "secondary"}
                          onClick={() => setSessionModal({ session, day, time })}
                          aria-label={`Open session for ${day} ${time}`}
                        >
                          {session ? session.label : "Add"}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {sessionModal && (
          <SessionModal
            session={sessionModal.session}
            day={sessionModal.day}
            time={sessionModal.time}
            onClose={() => setSessionModal(null)}
          />
        )}
      </Section>
    );
  }

  // ---- Session Modal ----
  function SessionModal({ session, day, time, onClose }) {
    // For demo, local state only
    const [entries, setEntries] = useState(session ? session.entries : []);
    const [adding, setAdding] = useState(false);
    const [newExerciseId, setNewExerciseId] = useState("");
    const [newSets, setNewSets] = useState([{ weight: "", reps: "", rpe: "" }]);

    function addEntry() {
      if (!newExerciseId) return;
      setEntries([
        ...entries,
        {
          id: "e" + Math.random(),
          sessionId: session.id,
          exerciseId: newExerciseId,
          sets: newSets.map(s => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: Number(s.rpe) || 0,
          })),
        },
      ]);
      setAdding(false);
      setNewExerciseId("");
      setNewSets([{ weight: "", reps: "", rpe: "" }]);
    }
    function removeEntry(idx) {
      setEntries(entries.filter((_, i) => i !== idx));
    }
    return (
      <ModalOverlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <SectionTitle>
            {day} {time} Session
          </SectionTitle>
          <div style={{ marginBottom: 16 }}>
            <Button data-component="AddExerciseButton" onClick={() => setAdding(true)}>
              + Add Exercise
            </Button>
          </div>
          {adding && (
            <Card data-component="AddExerciseForm">
              <Label htmlFor="add-ex-select">Exercise</Label>
              <select
                id="add-ex-select"
                data-component="AddExerciseSelect"
                value={newExerciseId}
                onChange={e => setNewExerciseId(e.target.value)}
                style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 8 }}
              >
                <option value="">Select...</option>
                {db.exerciseLibrary.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>
              {newSets.map((set, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <Input
                    data-component="SetWeightInput"
                    type="number"
                    placeholder="Weight"
                    value={set.weight}
                    onChange={e => {
                      const v = e.target.value;
                      setNewSets(s => s.map((s2, j) => j === i ? { ...s2, weight: v } : s2));
                    }}
                  />
                  <Input
                    data-component="SetRepsInput"
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={e => {
                      const v = e.target.value;
                      setNewSets(s => s.map((s2, j) => j === i ? { ...s2, reps: v } : s2));
                    }}
                  />
                  <Input
                    data-component="SetRpeInput"
                    type="number"
                    placeholder="RPE"
                    value={set.rpe}
                    onChange={e => {
                      const v = e.target.value;
                      setNewSets(s => s.map((s2, j) => j === i ? { ...s2, rpe: v } : s2));
                    }}
                  />
                </div>
              ))}
              <Button data-component="AddSetButton" variant="secondary" onClick={() => setNewSets([...newSets, { weight: "", reps: "", rpe: "" }])}>+ Set</Button>
              <Button data-component="SaveExerciseButton" onClick={addEntry}>Save Exercise</Button>
              <Button data-component="CancelAddExerciseButton" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            </Card>
          )}
          <div data-component="ExerciseTable">
            {entries.length === 0 && <div>No exercises added yet.</div>}
            {entries.map((entry, idx) => {
              const ex = db.exerciseLibrary.find(e => e.id === entry.exerciseId);
              return (
                <Card data-component="ExerciseEntryCard" key={entry.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={ex.image} alt={ex.title} style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <strong>{ex.title}</strong>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{ex.type}</div>
                    </div>
                    <Button data-component="RemoveExerciseButton" variant="secondary" onClick={() => removeEntry(idx)}>Remove</Button>
                  </div>
                  <table data-component="SetTable" style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>RPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.sets.map((set, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{set.weight}</td>
                          <td>{set.reps}</td>
                          <td>{set.rpe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })}
          </div>
          <Button data-component="CloseSessionModalButton" onClick={onClose}>Close</Button>
        </Modal>
      </ModalOverlay>
    );
  }

  // ---- Nutrition Section ----
  function renderNutrition() {
    const day = db.nutritionDays.find(d => d.id === selectedDay);
    return (
      <Section data-component="NutritionTracker">
        <SectionTitle>Nutrition</SectionTitle>
        <Card data-component="MacroGoalsHeader">
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {macroKeys.map(k => (
              <div key={k} style={{ flex: 1 }}>
                <Label htmlFor={`macro-${k}`}>{k.charAt(0).toUpperCase() + k.slice(1)}</Label>
                <Input
                  id={`macro-${k}`}
                  data-component={`MacroInput-${k}`}
                  type="number"
                  value={day.macroGoals[k]}
                  onChange={() => {}}
                  disabled
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {macroKeys.map(k => {
              const total = day.meals.reduce((sum, m) => sum + (m.macros[k] || 0), 0);
              const percent = Math.round((total / day.macroGoals[k]) * 100);
              return (
                <div key={k} style={{ flex: 1, fontSize: 12, color: theme.colors.textSecondary }}>
                  {total} / {day.macroGoals[k]} ({percent}%)
                </div>
              );
            })}
          </div>
        </Card>
        <Card data-component="MealTable">
          <table data-component="MealTableTable" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Meal</th>
                {macroKeys.map(k => <th key={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</th>)}
              </tr>
            </thead>
            <tbody>
              {mealTypes.map(type => {
                const meal = day.meals.find(m => m.type === type);
                return (
                  <tr key={type}>
                    <td>{type}</td>
                    {macroKeys.map(k => (
                      <td key={k}>
                        <Input
                          data-component={`MealInput-${type}-${k}`}
                          type="number"
                          value={meal.macros[k]}
                          onChange={() => {}}
                          disabled
                          style={{ width: 60, fontSize: 14, padding: 4, height: 32 }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </Section>
    );
  }

  // ---- Plans Section ----
  function renderPlans() {
    const plans = db.plans.filter(p => p.category === planCategory);
    return (
      <Section data-component="PlanBrowser">
        <SectionTitle>Preset Workout Plans</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {planCategories.map(cat => (
            <Button
              key={cat}
              data-component="PlanCategoryTab"
              variant={planCategory === cat ? undefined : "secondary"}
              onClick={() => setPlanCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div>
          {plans.map(plan => (
            <Card data-component="PlanCard" key={plan.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <strong>{plan.title}</strong>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{plan.description}</div>
                </div>
                <Button data-component="ViewPlanButton" onClick={() => setSelectedPlan(plan)}>
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {selectedPlan && (
          <ModalOverlay onClick={() => setSelectedPlan(null)}>
            <Modal onClick={e => e.stopPropagation()}>
              <SectionTitle>{selectedPlan.title}</SectionTitle>
              <div style={{ marginBottom: 8 }}>{selectedPlan.description}</div>
              <table data-component="PlanChartTable" style={{ width: '100%', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Session</th>
                    <th>Exercises</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.chart.map((day, i) => (
                    day.sessions.map((sess, j) => (
                      <tr key={i + '-' + j}>
                        <td>{j === 0 ? day.day : ''}</td>
                        <td>{sess.label}</td>
                        <td>
                          {sess.exercises.map((ex, k) => {
                            const exObj = db.exerciseLibrary.find(e => e.id === ex.exerciseId);
                            return (
                              <div key={k}>
                                {exObj.title} {ex.sets ? `x${ex.sets}` : ''} {ex.reps ? `${ex.reps} reps` : ''} {ex.duration ? `${ex.duration} min` : ''}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
              <Button data-component="InjectPlanButton" onClick={() => alert('Plan injected!')}>Inject Plan</Button>
              <Button data-component="DownloadPlanButton" variant="secondary" onClick={() => alert('Download as PDF/JSON')}>Download</Button>
              <Button data-component="ClosePlanModalButton" variant="secondary" onClick={() => setSelectedPlan(null)}>Close</Button>
            </Modal>
          </ModalOverlay>
        )}
      </Section>
    );
  }

  // ---- Exercise Library ----
  function renderExerciseLibrary() {
    return (
      <Section data-component="ExerciseLibrary">
        <SectionTitle>Exercise Library</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {db.exerciseLibrary.map(ex => (
            <Card data-component="ExerciseCard" key={ex.id} style={{ width: 180, minHeight: 220 }}>
              <img src={ex.image} alt={ex.title} style={{ width: 48, height: 48, borderRadius: 8, marginBottom: 8 }} />
              <strong>{ex.title}</strong>
              <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>{ex.type}{ex.yogaCategory ? ` – ${ex.yogaCategory}` : ''}</div>
              <div style={{ fontSize: 14 }}>{ex.description}</div>
            </Card>
          ))}
        </div>
        <Card data-component="YogaCategories">
          <strong>Yoga Categories</strong>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 14 }}>
            {yogaCategories.map(cat => (
              <li key={cat}>{cat}</li>
            ))}
          </ul>
        </Card>
      </Section>
    );
  }

  // ---- Affiliate Promotion ----
  function renderAffiliatePromotion() {
    const promo = db.affiliatePromotions[0];
    return (
      <Section data-component="AffiliatePromotion">
        <Card data-component="PromotionCard" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 2 }}>
            <div style={{ fontWeight: 600, color: theme.colors.accent2, marginBottom: 4 }}>Planet Fitness Promo</div>
            <div style={{ marginBottom: 8 }}>{promo.copy}</div>
            <Button data-component="AffiliateCTAButton" as="a" href={promo.url} target="_blank" rel="noopener noreferrer">
              {promo.cta}
            </Button>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>{promo.disclosure}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <img
              src={promo.qrCodeUrl}
              alt="Planet Fitness QR Code"
              width={90}
              height={90}
              style={{ borderRadius: 12, background: '#fff', border: `2px solid ${theme.colors.border}` }}
              data-component="QRCodeImage"
            />
          </div>
        </Card>
      </Section>
    );
  }

  // ---- MAIN RENDER ----
  return (
    <>
      <GlobalStyle />
      <AppBar>
        <AppLogo>🏕️ Nomadic Gym Life</AppLogo>
        <AppNav>
          <NavTab active={tab === 0} onClick={() => setTab(0)} aria-label="Fitness Tracker">Tracker</NavTab>
          <NavTab active={tab === 1} onClick={() => setTab(1)} aria-label="Nutrition">Nutrition</NavTab>
          <NavTab active={tab === 2} onClick={() => setTab(2)} aria-label="Plans">Plans</NavTab>
          <NavTab active={tab === 3} onClick={() => setTab(3)} aria-label="Library">Library</NavTab>
          <NavTab active={tab === 4} onClick={() => setTab(4)} aria-label="Promo">Promo</NavTab>
        </AppNav>
      </AppBar>
      <Main>
        {tab === 0 && renderTracker()}
        {tab === 1 && renderNutrition()}
        {tab === 2 && renderPlans()}
        {tab === 3 && renderExerciseLibrary()}
        {tab === 4 && renderAffiliatePromotion()}
      </Main>
      <BottomNav>
        <BottomNavTab active={tab === 0} onClick={() => setTab(0)} aria-label="Fitness Tracker">
          <Icon>🏋️‍♂️</Icon>
          Tracker
        </BottomNavTab>
        <BottomNavTab active={tab === 1} onClick={() => setTab(1)} aria-label="Nutrition">
          <Icon>🍎</Icon>
          Nutrition
        </BottomNavTab>
        <BottomNavTab active={tab === 2} onClick={() => setTab(2)} aria-label="Plans">
          <Icon>📅</Icon>
          Plans
        </BottomNavTab>
        <BottomNavTab active={tab === 3} onClick={() => setTab(3)} aria-label="Library">
          <Icon>📚</Icon>
          Library
        </BottomNavTab>
        <BottomNavTab active={tab === 4} onClick={() => setTab(4)} aria-label="Promo">
          <Icon>💸</Icon>
          Promo
        </BottomNavTab>
      </BottomNav>
    </>
  );
}

export default App;
