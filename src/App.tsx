// Nomadic Gym Life – Mobile-First Fitness Tracker & Preset Plan App
// All theme tokens, GlobalStyle, and styled components are inline. No external CSS or theme imports.
// All data is loaded from useCMS (Sanity client).
// All React components include data-component attributes.
// Animation uses css helper from styled-components.

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@sanity/client";
import styled, { createGlobalStyle, css } from "styled-components";
import { useFirebaseAuth } from "./auth/FirebaseAuthContext";
import FitnessProgressTab, { type ProgressEntry } from "./components/tabs/FitnessProgressTab";

const GA_ID = "G-EXCXY8B3LX";

const sanityClient = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || "",
  dataset: process.env.REACT_APP_SANITY_DATASET || "production",
  token: process.env.REACT_APP_SANITY_READ_TOKEN,
  apiVersion: process.env.REACT_APP_SANITY_API_VERSION || "2024-01-01",
  useCdn: true,
});
const sanityFetch = <T,>(query: string, params?: Record<string, unknown>): Promise<T> =>
  (sanityClient as { fetch: (q: string, p?: Record<string, unknown>) => Promise<T> }).fetch(query, params);

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
    drawer: 200,
  },
};
const defaultTheme = theme;
type DataComponentProps = {
  'data-component'?: string;
};
type ButtonProps = DataComponentProps & {
  variant?: 'primary' | 'secondary';
};
type LegendSwatchProps = {
  $color?: string;
};
type CalendarDayButtonProps = {
  $muted?: boolean;
  $isSelected?: boolean;
  $hasWorkout?: boolean;
};
type BottomNavTabProps = DataComponentProps & {
  active?: boolean;
};
type NavButtonProps = DataComponentProps & {
  active?: boolean;
  'aria-label'?: string;
};
type MacroKey = 'protein' | 'carbs' | 'fat';
type MacroPercents = { protein: number; carbs: number; fat: number };
type ExerciseSet = {
  weight: number;
  reps: number;
  rpe?: number;
  actualReps?: number;
  actualDuration?: number;
  duration?: { value: number; unit: string };
};
type ExerciseEntry = {
  id: string;
  userId?: string;
  sessionId: string;
  exerciseId: string;
  sets: ExerciseSet[];
};
type Session = {
  id: string;
  userId?: string;
  day: string;
  time: string;
  label: string;
  entries: ExerciseEntry[];
};
type Week = {
  id: string;
  userId?: string;
  startDate: string;
  endDate: string;
  label: string;
  sessions: Session[];
};
type Meal = {
  id: string;
  userId?: string;
  dayId: string;
  type: string;
  macros: { protein: number; carbs: number; fat: number; calories: number };
};
type NutritionDay = {
  id: string;
  userId?: string;
  date: string;
  calories: number;
  macroPercents: MacroPercents;
  meals: Meal[];
};
type PlanExercise = {
  exerciseId: string;
  sets?: number;
  reps?: number;
  duration?: { value: number; unit: string };
};
type PlanSession = {
  label: string;
  exercises: PlanExercise[];
};
type PlanDay = {
  day: string;
  sessions: PlanSession[];
};
type Plan = {
  id: string;
  title: string;
  category: string;
  description: string;
  chart: PlanDay[];
};
type Exercise = {
  id: string;
  title: string;
  description: string;
  image: string;
  type: string;
  yogaCategory: string | null;
};
type AffiliatePromotion = {
  id: string;
  cta: string;
  url: string;
  qrCodeUrl: string;
  disclosure: string;
  copy: string;
};
type UserProfile = {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  goalCalories?: number;
  macroPercents?: MacroPercents;
};
type SessionModalState = {
  session: Session | null;
  day: string;
  time: string;
};
type NutritionDayPatch = {
  id?: string;
  date: string;
  calories: number;
  macroPercents: MacroPercents;
  meals: Array<{
    id: string;
    dayId: string;
    type: string;
    macros: { protein: number; carbs: number; fat: number; calories: number };
  }>;
};
type UpsertNutritionPayload = {
  date: string;
  patch: NutritionDayPatch;
};
type InjectPlanPayload = {
  planId: string;
  startDate: string;
  weekLabel: string;
};
const dataComponent = (value: string): Record<string, string> => ({ 'data-component': value });

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
const AppBar = styled.header.attrs(dataComponent('AppBar'))`
  background: ${theme.colors.navBg};
  color: ${theme.colors.navText};
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: 0 ${theme.spacing.md};
  box-shadow: ${theme.shadow.nav};
  position: sticky;
  top: 0;
  z-index: ${theme.z.nav};
`;
const AppLogo = styled.div.attrs(dataComponent('AppLogo'))`
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
  flex: 0 0 auto;
`;
const AppNav = styled.nav.attrs(dataComponent('AppNav'))`
  display: flex;
  gap: ${theme.spacing.md};
  flex: 1;
  justify-content: center;
  @media (max-width: 720px) {
    display: none;
  }
`;
const NavTab = styled.button.attrs((props: NavButtonProps) => ({
  'data-component': 'NavTab',
  'aria-label': props['aria-label'],
  'aria-current': props.active ? 'page' : undefined,
} as Record<string, unknown>))<NavButtonProps>`
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
const Main = styled.main.attrs(dataComponent('Main'))`
  padding: ${theme.spacing.md};
  max-width: 480px;
  margin: 0 auto 72px auto;
`;
const Section = styled.section.attrs(dataComponent('Section'))<DataComponentProps>`
  margin-bottom: ${theme.spacing.lg};
  ${fadeIn}
`;
const Card = styled.div.attrs(dataComponent('Card'))<DataComponentProps>`
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;
const AuthGateCard = styled(Card).attrs(dataComponent('AuthGateCard'))`
  text-align: center;
  padding: ${theme.spacing.lg};
`;
const AuthGateTitle = styled.h3.attrs(dataComponent('AuthGateTitle'))`
  margin: 0 0 ${theme.spacing.sm} 0;
  color: ${theme.colors.primary};
`;
const AuthGateText = styled.p.attrs(dataComponent('AuthGateText'))`
  margin: 0 0 ${theme.spacing.md} 0;
  color: ${theme.colors.textSecondary};
`;
const AuthHint = styled.p.attrs(dataComponent('AuthHint'))`
  margin: ${theme.spacing.sm} 0 0 0;
  color: ${theme.colors.textSecondary};
  font-size: 0.85rem;
`;
const ProfileMenuButton = styled.button.attrs(dataComponent('ProfileMenuButton'))`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: ${theme.colors.navText};
  border-radius: ${theme.radii.button};
  padding: 4px 10px 4px 6px;
  cursor: pointer;
  font: ${theme.font.button};
  font-size: 0.8rem;
  transition: background 0.2s, color 0.2s;
  &:hover, &:focus {
    background: ${theme.colors.accent};
    color: ${theme.colors.text};
    outline: 2px solid ${theme.colors.accent};
  }
`;
const ProfileAvatar = styled.div.attrs(dataComponent('ProfileAvatar'))`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${theme.colors.card};
  color: ${theme.colors.primary};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const ProfileSummaryButton = styled.button.attrs(dataComponent('ProfileSummaryButton'))`
  width: 100%;
  text-align: left;
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.md};
  cursor: pointer;
  display: block;
  &:hover, &:focus {
    outline: 2px solid ${theme.colors.accent};
  }
`;
const ProfileMenuLabel = styled.span.attrs(dataComponent('ProfileMenuLabel'))`
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const HamburgerIcon = styled.span.attrs(dataComponent('HamburgerIcon'))`
  width: 16px;
  height: 10px;
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  span {
    height: 2px;
    width: 100%;
    background: currentColor;
    border-radius: 2px;
  }
`;
const ProfileDrawerOverlay = styled.div.attrs(dataComponent('ProfileDrawerOverlay'))`
  position: fixed;
  inset: 0;
  background: rgba(34, 34, 34, 0.28);
  z-index: ${theme.z.drawer};
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;
const ProfileDrawer = styled.div.attrs(dataComponent('ProfileDrawer'))`
  width: 320px;
  max-width: 90vw;
  height: 100%;
  background: ${theme.colors.card};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.md};
  overflow-y: auto;
`;
const DrawerSection = styled.div.attrs(dataComponent('DrawerSection'))`
  margin-bottom: ${theme.spacing.lg};
`;
const DrawerTitle = styled.h3.attrs(dataComponent('DrawerTitle'))`
  margin: 0 0 ${theme.spacing.sm} 0;
  color: ${theme.colors.primary};
`;
const DrawerTabList = styled.div.attrs(dataComponent('DrawerTabList'))`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.sm};
`;
const ProfileFormRow = styled.div.attrs(dataComponent('ProfileFormRow'))`
  display: grid;
  gap: 8px;
`;
const ReadOnlyValueButton = styled.button.attrs(dataComponent('ReadOnlyValueButton'))`
  min-width: 48px;
  padding: 6px 10px;
  border-radius: ${theme.radii.input};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  color: ${theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  &:hover, &:focus {
    outline: 2px solid ${theme.colors.accent};
  }
`;
const NumberPadOverlay = styled.div.attrs(dataComponent('NumberPadOverlay'))`
  position: fixed;
  inset: 0;
  background: rgba(34, 34, 34, 0.35);
  z-index: ${theme.z.modal + 1};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const NumberPadCard = styled.div.attrs(dataComponent('NumberPadCard'))`
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  box-shadow: ${theme.shadow.card};
  width: min(320px, 90vw);
  padding: ${theme.spacing.md};
  display: grid;
  gap: ${theme.spacing.sm};
`;
const NumberPadDisplay = styled.div.attrs(dataComponent('NumberPadDisplay'))`
  height: 44px;
  border-radius: ${theme.radii.input};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${theme.spacing.sm};
  font-size: 1.1rem;
  font-weight: 700;
  color: ${theme.colors.primary};
`;
const NumberPadGrid = styled.div.attrs(dataComponent('NumberPadGrid'))`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.sm};
`;
const SectionTitle = styled.h2.attrs(() => ({
  'data-component': 'SectionTitle',
} as Record<string, unknown>))`
  font: ${theme.font.heading};
  color: ${theme.colors.primary};
  margin: 0 0 ${theme.spacing.sm} 0;
`;
const Button = styled.button.attrs(dataComponent('Button'))<ButtonProps>`
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
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;
const IconButton = styled(Button).attrs(dataComponent('IconButton'))`
  min-width: unset;
  margin: 0;
  padding: 6px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
const NumberPadButton = styled(Button).attrs(dataComponent('NumberPadButton'))`
  min-width: unset;
  margin: 0;
  padding: 10px 0;
  font-size: 0.95rem;
`;
const SpinnerDot = styled.div.attrs(dataComponent('SpinnerDot'))`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${theme.colors.border};
  border-top-color: ${theme.colors.accent};
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
const LoadingButton = styled(Button).attrs(dataComponent('LoadingButton'))`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
const DrawerTabButton = styled(Button).attrs(dataComponent('DrawerTabButton'))`
  min-width: unset;
  margin: 0;
  padding: 8px 10px;
  font-size: 0.8rem;
`;
const AuthButton = styled(Button).attrs(dataComponent('AuthButton'))`
  margin: 0;
  min-width: unset;
  padding: 6px 12px;
  font-size: 0.8rem;
`;
const Input = styled.input.attrs(dataComponent('Input'))`
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
const Label = styled.label.attrs(dataComponent('Label'))`
  font-size: 1rem;
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xs};
  display: block;
`;
const ModalOverlay = styled.div.attrs(dataComponent('ModalOverlay'))`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(62,76,89,0.24);
  z-index: ${theme.z.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Modal = styled.div.attrs(dataComponent('Modal'))`
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card};
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.lg};
  min-width: 320px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  margin: ${theme.spacing.md};
  ${fadeIn}
`;
const InjectModal = styled(Modal).attrs(dataComponent('InjectModal'))`
  max-width: 420px;
`;
const PlanModal = styled(Modal).attrs(dataComponent('PlanModal'))`
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-self: flex-start;
  margin-top: ${theme.spacing.lg};
`;
const PlanModalBody = styled.div.attrs(dataComponent('PlanModalBody'))`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${theme.spacing.md};
`;
const PlanFilterRow = styled.div.attrs(dataComponent('PlanFilterRow'))`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin: ${theme.spacing.sm} 0 ${theme.spacing.md};
`;
const PlanFilterLabel = styled.span.attrs(dataComponent('PlanFilterLabel'))`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${theme.colors.textSecondary};
`;
const PlanFilterToggle = styled(Button).attrs(dataComponent('PlanFilterToggle'))`
  min-width: unset;
  margin: 0;
  padding: 6px 12px;
  font-size: 0.75rem;
`;
const PlanFilterMenu = styled.div.attrs(dataComponent('PlanFilterMenu'))`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.card};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  background: ${theme.colors.card};
`;
const PlanFilterGroup = styled.div.attrs(dataComponent('PlanFilterGroup'))`
  margin-bottom: ${theme.spacing.sm};
`;
const PlanFilterOption = styled.label.attrs(dataComponent('PlanFilterOption'))`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  margin-right: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xs};
`;
const PlanDayText = styled.div.attrs(dataComponent('PlanDayText'))`
  font-weight: 700;
  color: ${theme.colors.primary};
`;
const PlanDayGroup = styled.div.attrs(dataComponent('PlanDayGroup'))`
  margin-bottom: ${theme.spacing.md};
`;
const PlanDayHeader = styled.div.attrs(dataComponent('PlanDayHeader'))`
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${theme.colors.card};
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};
`;
const PlanSessionRow = styled.div.attrs(dataComponent('PlanSessionRow'))`
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};
`;
const PlanSessionLabel = styled.div.attrs(dataComponent('PlanSessionLabel'))`
  font-weight: 600;
`;
const PlanSessionTime = styled.span.attrs(dataComponent('PlanSessionTime'))`
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(242, 95, 92, 0.12);
  color: ${theme.colors.accent2};
`;
const PlanExerciseMeta = styled.div.attrs(dataComponent('PlanExerciseMeta'))`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
`;
const BottomNav = styled.nav.attrs(dataComponent('BottomNav'))`
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
const BottomNavTab = styled.button.attrs((props) => ({
  'data-component': 'BottomNavTab',
  'aria-label': props['aria-label'],
  'aria-current': (props as BottomNavTabProps).active ? 'page' : undefined,
} as Record<string, unknown>))<BottomNavTabProps>`
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
const IconWrapper = styled.span.attrs(dataComponent('Icon'))`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  width: 24px;
  height: 24px;
`;
const SvgIcon = styled.svg.attrs(dataComponent('SvgIcon'))`
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;
const SetTable = styled.table.attrs(dataComponent('SetTable'))`
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  table-layout: fixed;
  th, td {
    text-align: left;
    padding: 6px 4px;
  }
  th:nth-child(1),
  td:nth-child(1) {
    width: 12%;
  }
  th:nth-child(2),
  td:nth-child(2) {
    width: 28%;
  }
  th:nth-child(3),
  td:nth-child(3) {
    width: 30%;
  }
  th:nth-child(4),
  td:nth-child(4) {
    width: 30%;
  }
  th {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${theme.colors.textSecondary};
    border-bottom: 1px solid ${theme.colors.border};
  }
  td {
    font-size: 0.9rem;
  }
`;
const WeekTable = styled.table.attrs(dataComponent('WeekTable'))`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 8px 6px;
    vertical-align: top;
  }
  tbody tr + tr td {
    border-top: 1px solid ${theme.colors.border};
  }
`;
const WeekTableHeadCell = styled.th.attrs(dataComponent('WeekTableHeadCell'))`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.textSecondary};
  font-weight: 700;
`;
const WeekTableDayCell = styled.td.attrs(dataComponent('WeekTableDayCell'))`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${theme.colors.primary};
`;
const WeekDayButton = styled.button.attrs(dataComponent('WeekDayButton'))`
  width: 100%;
  display: grid;
  gap: 2px;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
  &:hover, &:focus {
    outline: 2px solid ${theme.colors.accent};
    border-radius: ${theme.radii.input};
  }
`;
const DailyModal = styled(PlanModal).attrs(dataComponent('DailyModal'))`
  max-width: 520px;
`;
const DailyModalHeader = styled.div.attrs(dataComponent('DailyModalHeader'))`
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${theme.colors.card};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.border};
`;
const DailyModalBody = styled(PlanModalBody).attrs(dataComponent('DailyModalBody'))`
  margin-top: ${theme.spacing.sm};
`;
const DailyTimeHeader = styled.button.attrs(dataComponent('DailyTimeHeader'))`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} 0;
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.primary};
  font: ${theme.font.button};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  &:hover, &:focus {
    outline: 2px solid ${theme.colors.accent};
    border-radius: ${theme.radii.input};
  }
`;
const DailyTimeCount = styled.span.attrs(dataComponent('DailyTimeCount'))`
  font-size: 0.7rem;
  color: ${theme.colors.textSecondary};
  font-weight: 600;
`;
const MacroSummary = styled.div.attrs(dataComponent('MacroSummary'))`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;
const TotalCaloriesInput = styled(Input).attrs(dataComponent('TotalCaloriesInput'))`
  font-size: 2rem;
  font-weight: 700;
  color: ${theme.colors.primary};
  margin-bottom: 0;
  border: 1px solid ${theme.colors.border};
`;
const MacroLabel = styled.div.attrs(dataComponent('MacroLabel'))`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
const SliderRow = styled.div.attrs(dataComponent('SliderRow'))`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;
const SliderInput = styled.input.attrs(() => ({ type: 'range', 'data-component': 'SliderInput' } as Record<string, string>))`
  width: 100%;
  margin: 0;
`;
const SliderTicks = styled.div.attrs(dataComponent('SliderTicks'))`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  text-align: center;
`;
const CalendarHeader = styled.div.attrs(dataComponent('CalendarHeader'))`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.sm};
`;
const CalendarTitle = styled.div.attrs(dataComponent('CalendarTitle'))`
  font-weight: 700;
  color: ${theme.colors.primary};
`;
const CalendarNavButton = styled.button.attrs(dataComponent('CalendarNavButton'))`
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  color: ${theme.colors.primary};
  border-radius: ${theme.radii.input};
  width: 32px;
  height: 32px;
  cursor: pointer;
  &:hover, &:focus {
    border-color: ${theme.colors.accent};
    outline: 2px solid ${theme.colors.accent};
  }
`;
const CalendarGrid = styled.div.attrs(dataComponent('CalendarGrid'))`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
`;
const CalendarLegend = styled.div.attrs(dataComponent('CalendarLegend'))`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: ${theme.spacing.sm};
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
`;
const LegendItem = styled.div.attrs(dataComponent('LegendItem'))`
  display: flex;
  align-items: center;
  gap: 6px;
`;
const LegendSwatch = styled.span.attrs(dataComponent('LegendSwatch'))<LegendSwatchProps>`
  width: 12px;
  height: 12px;
  border-radius: 4px;
  border: 1px solid ${theme.colors.border};
  background: ${props => props.$color || theme.colors.card};
`;
const CalendarDrawerOverlay = styled.div.attrs(dataComponent('CalendarDrawerOverlay'))`
  position: fixed;
  inset: 0;
  background: rgba(34, 34, 34, 0.28);
  z-index: ${theme.z.drawer};
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;
const CalendarDrawer = styled.div.attrs(dataComponent('CalendarDrawer'))`
  width: 100%;
  max-width: 520px;
  background: ${theme.colors.card};
  border-radius: ${theme.radii.card} ${theme.radii.card} 0 0;
  box-shadow: ${theme.shadow.card};
  padding: ${theme.spacing.md};
  max-height: 80vh;
  overflow-y: auto;
`;
const CalendarWeekday = styled.div.attrs(dataComponent('CalendarWeekday'))`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.textSecondary};
  text-align: center;
`;
const CalendarDayButton = styled.button.attrs(dataComponent('CalendarDayButton'))<CalendarDayButtonProps>`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.input};
  background: ${theme.colors.card};
  color: ${props => props.$muted ? theme.colors.textSecondary : theme.colors.primary};
  font-weight: 600;
  padding: 8px 0;
  cursor: pointer;
  position: relative;
  ${({ $isSelected }) => $isSelected && `
    border-color: ${theme.colors.accent2};
    box-shadow: inset 0 0 0 2px ${theme.colors.accent2};
  `}
  ${({ $hasWorkout }) => $hasWorkout && `
    background: rgba(67, 170, 139, 0.12);
    border-color: ${theme.colors.success};
  `}
`;
const CalendarDot = styled.span.attrs(dataComponent('CalendarDot'))`
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: ${theme.colors.accent};
`;
const DatePager = styled.div.attrs(dataComponent('DatePager'))`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;
const DatePagerButton = styled(Button).attrs(dataComponent('DatePagerButton'))`
  min-width: unset;
  margin: 0;
  padding: 6px 12px;
  font-size: 0.8rem;
`;
const SessionStack = styled.div.attrs(dataComponent('SessionStack'))`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: ${theme.radii.input};
  border: 1px solid ${theme.colors.border};
`;
const SessionCellButton = styled(Button).attrs(dataComponent('SessionCellButton'))`
  margin: 0;
  min-width: unset;
  width: 100%;
  border-radius: 0;
  box-shadow: none;
  font-size: 0.82rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  &:hover, &:focus {
    outline-offset: -2px;
  }
  & + & {
    box-shadow: inset 0 1px 0 ${theme.colors.border};
  }
`;
const TrackerIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12h3l2-3 4 6 2-3h7" />
    <rect x="2" y="9" width="4" height="6" rx="1" />
    <rect x="18" y="9" width="4" height="6" rx="1" />
  </SvgIcon>
);
const NutritionIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5c3.8 0 7 3.2 7 7s-3.2 7-7 7-7-3.2-7-7 3.2-7 7-7z" />
    <path d="M12 5c0-2 1.5-3 3-3" />
    <path d="M9 12h6" />
  </SvgIcon>
);
const PlansIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M7 13h3M14 13h3M7 16h3" />
  </SvgIcon>
);
const LibraryIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5z" />
    <path d="M7 5v14" />
  </SvgIcon>
);
const PromoIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7h6l4 4-6 6-4-4V7z" />
    <circle cx="10" cy="10" r="1.5" />
  </SvgIcon>
);
const ProgressIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M21 17l-5-5-4 4-2-2-4 4" />
  </SvgIcon>
);
const PlusIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </SvgIcon>
);
const MinusIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14" />
  </SvgIcon>
);
const EqualizerIcon = () => (
  <SvgIcon viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 4v16" />
    <path d="M12 4v16" />
    <path d="M18 4v16" />
    <path d="M4 8h4" />
    <path d="M10 12h4" />
    <path d="M16 16h4" />
  </SvgIcon>
);

async function fetchWeeks(userId: string): Promise<Week[]> {
  return sanityFetch(
    `*[_type == "week" && userId == $userId]{
      "id": _id,
      userId,
      startDate,
      endDate,
      label,
      "sessions": sessions[]->{
        "id": _id,
        userId,
        day,
        time,
        label,
        "entries": *[_type == "exerciseEntry" && userId == $userId && sessionId._ref == ^._id]{
          "id": _id,
          userId,
          "exerciseId": exerciseId._ref,
          sets
        }
      }
    }`,
    { userId }
  );
}

async function fetchNutritionDays(userId: string): Promise<NutritionDay[]> {
  return sanityFetch(
    `*[_type == "nutritionDay" && userId == $userId]{
      "id": _id,
      userId,
      date,
      "calories": macroGoals.calories,
      "macroPercents": {
        "protein": macroPercents.protein,
        "carbs": macroPercents.carbs,
        "fat": macroPercents.fat
      },
      "meals": *[_type == "meal" && userId == $userId && dayId._ref == ^._id]{
        "id": _id,
        userId,
        type,
        macros
      }
    }`,
    { userId }
  );
}

async function fetchPlans(): Promise<Plan[]> {
  return sanityFetch(
    `*[_type == "plan"]{
      "id": _id,
      title,
      category,
      description,
      "chart": chart[]{
        day,
        "sessions": sessions[]{
          label,
          "exercises": exercises[]{
            "exerciseId": exerciseId._ref,
            sets,
            reps,
            duration
          }
        }
      }
    }`
  );
}

async function fetchExercises(): Promise<Exercise[]> {
  return sanityFetch(
    `*[_type == "exercise"]{
      "id": _id,
      title,
      description,
      image,
      type,
      yogaCategory
    }`
  );
}

async function fetchAffiliatePromotions(): Promise<AffiliatePromotion[]> {
  return sanityFetch(
    `*[_type == "affiliatePromotion"]{
      "id": _id,
      cta,
      url,
      qrCodeUrl,
      disclosure,
      copy
    }`
  );
}

function useCMS(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    getWeeks: () => (userId ? run(() => fetchWeeks(userId)) : Promise.resolve([] as Week[])),
    getNutritionDays: () => (userId ? run(() => fetchNutritionDays(userId)) : Promise.resolve([] as NutritionDay[])),
    getPlans: () => run(fetchPlans),
    getExercises: () => run(fetchExercises),
    getAffiliatePromotions: () => run(fetchAffiliatePromotions),
  };
}

function useAPI(getIdToken?: () => Promise<string | null>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const baseUrl = `${process.env.REACT_APP_API_BASE || ""}/api`;
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!getIdToken) return {};
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    getUserProfile: () =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/users/me`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Profile fetch failed with status ${response.status}`);
        }
        return response.json();
      }),
    upsertUserProfile: (profile: {
      displayName?: string;
      photoURL?: string;
      goalCalories?: number;
      macroPercents?: MacroPercents;
    }) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/users/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(profile),
        });
        if (!response.ok) {
          throw new Error(`Profile update failed with status ${response.status}`);
        }
        return response.json();
      }),
    updateExerciseEntry: (entryId: string, sets: ExerciseSet[]) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/tracker/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ sets }),
        });
        if (!response.ok) {
          throw new Error(`Entry update failed with status ${response.status}`);
        }
        return response.json();
      }),
    upsertNutritionDay: ({ date, patch }: UpsertNutritionPayload) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/nutrition/days/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ date, patch }),
        });
        if (!response.ok) {
          throw new Error(`Upsert failed with status ${response.status}`);
        }
        return response.json();
      }),
    injectPlanToWeek: ({ planId, startDate, weekLabel }: InjectPlanPayload) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/tracker/weeks/inject`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ planId, startDate, weekLabel }),
        });
        if (!response.ok) {
          throw new Error(`Inject failed with status ${response.status}`);
        }
        return response.json();
      }),
    getProgressEntries: () =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/progress/entries`, {
          method: "GET",
          headers: { ...authHeaders },
        });
        if (!response.ok) {
          throw new Error(`Progress fetch failed with status ${response.status}`);
        }
        return response.json();
      }),
    createProgressEntry: (formData: FormData) =>
      run(async () => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/progress/entries`, {
          method: "POST",
          headers: { ...authHeaders },
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Progress upload failed with status ${response.status}`);
        }
        return response.json();
      }),
  };
}

// ---- UTILS ----
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sessionTimes = ["AM", "PM"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const mealMacroKeys: MacroKey[] = ["protein", "carbs", "fat"];
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
const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatReadableDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function getUpcomingMondays(count: number): Date[] {
  const results = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  let cursor = addDays(start, daysUntilMonday);
  for (let i = 0; i < count; i += 1) {
    results.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }
  return results;
}

function stripSessionTime(label: string): string {
  return label.replace(/\s*\b(AM|PM)\b/i, "").trim();
}


function uid(prefix = "id"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function gramsFromPercents(
  calories: number,
  percents: MacroPercents
): { protein: number; carbs: number; fat: number } {
  const safeCalories = calories > 0 ? calories : 0;
  return {
    protein: Math.round((safeCalories * percents.protein) / 100 / 4),
    carbs: Math.round((safeCalories * percents.carbs) / 100 / 4),
    fat: Math.round((safeCalories * percents.fat) / 100 / 9),
  };
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function durationToMinutes(duration?: { value: number; unit: string }): number | null {
  if (!duration) return null;
  if (duration.unit === "min") return duration.value;
  if (duration.unit === "sec") return Math.round(duration.value / 60);
  if (duration.unit === "hr") return Math.round(duration.value * 60);
  return duration.value;
}

// ---- APP ----
function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut, hasConfig, getIdToken } = useFirebaseAuth();
  const cms = useCMS(user?.email || "");
  const api = useAPI(getIdToken);
  const [authError, setAuthError] = useState<string | null>(null);
  const isAuthed = Boolean(user);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profilePhotoDraft, setProfilePhotoDraft] = useState("");
  const [profileGoalCaloriesDraft, setProfileGoalCaloriesDraft] = useState("");
  const [profileMacroPercentsDraft, setProfileMacroPercentsDraft] = useState<MacroPercents>({
    protein: 40,
    carbs: 40,
    fat: 20,
  });
  const [profileCaloriesPad, setProfileCaloriesPad] = useState<string | null>(null);
  const [macroSliderPad, setMacroSliderPad] = useState<{
    mealType: string;
    macroKey: MacroKey;
    value: number;
  } | null>(null);

  // Navigation state
  const [tab, setTab] = useState(0); // 0:Tracker, 1:Nutrition, 2:Plans, 3:Library, 4:Promo, 5:Progress

  // Tracker state
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [sessionModal, setSessionModal] = useState<SessionModalState | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dailyModal, setDailyModal] = useState<{ day: string; date: Date } | null>(null);

  // Nutrition state
  const [nutritionDays, setNutritionDays] = useState<NutritionDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => parseDate(formatDate(new Date())));
  const [nutritionUnit, setNutritionUnit] = useState("grams");
  const defaultMacroPercents: MacroPercents = { protein: 40, carbs: 40, fat: 20 };

  // Plans state
  const [planCategory, setPlanCategory] = useState(planCategories[0]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planDayFilter, setPlanDayFilter] = useState("All");
  const [planTimeFilters, setPlanTimeFilters] = useState({ am: true, pm: true });
  const [planTypeFilters, setPlanTypeFilters] = useState<string[]>([]);
  const [planYogaFilters, setPlanYogaFilters] = useState<string[]>([]);
  const [planFiltersOpen, setPlanFiltersOpen] = useState(false);
  const [libraryFiltersOpen, setLibraryFiltersOpen] = useState(false);
  const [libraryTypeFilters, setLibraryTypeFilters] = useState<string[]>([]);
  const [libraryYogaFilters, setLibraryYogaFilters] = useState<string[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  const [injectPlan, setInjectPlan] = useState<Plan | null>(null);
  const [injectWeekLabel, setInjectWeekLabel] = useState("Week 1");
  const [injectMondayDate, setInjectMondayDate] = useState(() => formatDate(getUpcomingMondays(1)[0]));

  const [plans, setPlans] = useState<Plan[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [affiliatePromotions, setAffiliatePromotions] = useState<AffiliatePromotion[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const exerciseById = useMemo<Record<string, Exercise>>(
    () => Object.fromEntries(exerciseLibrary.map(ex => [ex.id, ex])),
    [exerciseLibrary]
  );

  const refreshWeeks = async (): Promise<Week[] | null> => {
    if (!isAuthed) return null;
    const weekData = await cms.getWeeks();
    if (weekData) {
      setWeeks(weekData);
      if (!selectedWeek && weekData[0]) {
        setSelectedWeek(weekData[0].id);
      }
    }
    return weekData;
  };

  const refreshProgressEntries = async (): Promise<ProgressEntry[] | null> => {
    if (!isAuthed) return null;
    setProgressLoading(true);
    const progressData = await api.getProgressEntries();
    if (progressData) {
      setProgressEntries(progressData as ProgressEntry[]);
    }
    setProgressLoading(false);
    return progressData as ProgressEntry[] | null;
  };

  const refreshNutritionDays = async (): Promise<NutritionDay[] | null> => {
    if (!isAuthed) return null;
    const nutritionData = await cms.getNutritionDays();
    if (nutritionData) {
      setNutritionDays(nutritionData);
      if (nutritionData[0]) {
        setSelectedDate(nutritionData[0].date);
        setCalendarMonth(parseDate(nutritionData[0].date));
      }
    }
    return nutritionData;
  };

  useEffect(() => {
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    const s2 = document.createElement("script");
    s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(s1);
    document.head.appendChild(s2);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      cms.getPlans(),
      cms.getExercises(),
      cms.getAffiliatePromotions(),
    ]).then(([planData, exerciseData, promoData]) => {
      if (!active) return;
      setPlans(planData ?? []);
      setExerciseLibrary(exerciseData ?? []);
      setAffiliatePromotions(promoData ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!isAuthed) {
      setWeeks([]);
      setNutritionDays([]);
      setProgressEntries([]);
      setSelectedWeek("");
      setInjectWeekLabel("Week 1");
      setUserProfile(null);
      return () => {
        active = false;
      };
    }
    Promise.all([
      cms.getWeeks(),
      cms.getNutritionDays(),
    ]).then(([weekData, nutritionData]) => {
      if (!active) return;
      setWeeks(weekData ?? []);
      setNutritionDays(nutritionData ?? []);
      if (weekData && weekData[0]) {
        setSelectedWeek(weekData[0].id);
      }
      if (nutritionData && nutritionData[0]) {
        setSelectedDate(nutritionData[0].date);
        setCalendarMonth(parseDate(nutritionData[0].date));
      }
      setInjectWeekLabel(`Week ${(weekData || []).length + 1}`);
      refreshProgressEntries();
    });
    return () => {
      active = false;
    };
  }, [isAuthed]);

  useEffect(() => {
    let active = true;
    if (!isAuthed || !user) {
      return () => {
        active = false;
      };
    }
    api
      .upsertUserProfile({
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      })
      .then(profile => {
        if (!active) return;
        if (profile) {
          setUserProfile(profile as UserProfile);
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthError("Unable to sync user profile.");
      });
    return () => {
      active = false;
    };
  }, [isAuthed, user]);

  useEffect(() => {
    if (!isAuthed) {
      setProfileNameDraft("");
      setProfilePhotoDraft("");
      setProfileGoalCaloriesDraft("");
      setProfileMacroPercentsDraft({ protein: 40, carbs: 40, fat: 20 });
      return;
    }
    const name = userProfile?.displayName || user?.displayName || "";
    const photo = userProfile?.photoURL || user?.photoURL || "";
    const calories = userProfile?.goalCalories ?? "";
    const macroPercents = userProfile?.macroPercents || { protein: 40, carbs: 40, fat: 20 };
    setProfileNameDraft(name);
    setProfilePhotoDraft(photo);
    setProfileGoalCaloriesDraft(calories === "" ? "" : String(calories));
    setProfileMacroPercentsDraft(macroPercents);
  }, [isAuthed, user, userProfile]);

  useEffect(() => {
    if (!profileOpen) {
      setProfileDetailsOpen(false);
    }
  }, [profileOpen]);

  const nutritionDates = new Set(nutritionDays.map(d => d.date));
  const sortedNutritionDates = [...nutritionDays]
    .map(d => d.date)
    .sort();
  const workoutRanges = weeks.map(week => ({
    start: parseDate(week.startDate),
    end: parseDate(week.endDate),
  }));
  const findWeekForDate = (date: Date) =>
    weeks.find(week => {
      const start = parseDate(week.startDate);
      const end = parseDate(week.endDate);
      return date >= start && date <= end;
    });
  const getDayLabelForDate = (date: Date) => daysOfWeek[(date.getDay() + 6) % 7];
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const startOffset = (monthStart.getDay() + 6) % 7;
  const calendarDays: Date[] = Array.from({ length: 42 }, (_, i) => {
    const dayIndex = i - startOffset + 1;
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayIndex);
  });
  const hasWorkoutDay = (date: Date) =>
    workoutRanges.some(range => date >= range.start && date <= range.end);
  const buildNextNutritionDays = (
    dateKey: string,
    updater: (day: NutritionDay) => NutritionDay
  ): NutritionDay[] => {
    const existingIndex = nutritionDays.findIndex(day => day.date === dateKey);
    if (existingIndex === -1) {
      const dayId = uid("nd");
      const baseDay = {
        id: dayId,
        date: dateKey,
        calories: 0,
        macroPercents: { ...defaultMacroPercents },
        meals: mealTypes.map(type => ({
          id: uid("meal"),
          dayId,
          type,
          macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        })),
      };
      return [...nutritionDays, updater(baseDay)];
    }
    return nutritionDays.map(day => (day.date === dateKey ? updater(day) : day));
  };
  const upsertNutritionDay = async (
    dateKey: string,
    updater: (day: NutritionDay) => NutritionDay
  ) => {
    const nextDays = buildNextNutritionDays(dateKey, updater);
    const nextDay = nextDays.find(day => day.date === dateKey);
    if (nextDay) {
      await api.upsertNutritionDay({ date: dateKey, patch: nextDay });
      await refreshNutritionDays();
    }
  };
  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setCalendarMonth(parseDate(dateKey));
  };
  const handleCalendarDaySelect = (date: Date, close?: () => void) => {
    const dateKey = formatDate(date);
    handleSelectDate(dateKey);
    const matchingWeek = findWeekForDate(date);
    if (matchingWeek && isAuthed) {
      setSelectedWeek(matchingWeek.id);
      setDailyModal({ day: getDayLabelForDate(date), date });
      setTab(0);
      setProfileOpen(false);
      setCalendarOpen(false);
    }
    if (close) {
      close();
    }
  };
  const getAdjacentNutritionDates = (dateKey: string) => {
    if (sortedNutritionDates.length === 0) {
      return { prev: null, next: null };
    }
    const exactIndex = sortedNutritionDates.indexOf(dateKey);
    if (exactIndex !== -1) {
      return {
        prev: exactIndex > 0 ? sortedNutritionDates[exactIndex - 1] : null,
        next: exactIndex < sortedNutritionDates.length - 1 ? sortedNutritionDates[exactIndex + 1] : null,
      };
    }
    const nextIndex = sortedNutritionDates.findIndex(d => d > dateKey);
    if (nextIndex === -1) {
      return { prev: sortedNutritionDates[sortedNutritionDates.length - 1], next: null };
    }
    return {
      prev: nextIndex > 0 ? sortedNutritionDates[nextIndex - 1] : null,
      next: sortedNutritionDates[nextIndex],
    };
  };
  const upcomingMondays = getUpcomingMondays(12);
  const injectWeekLabelOptions = Array.from({ length: 4 }, (_, i) => `Week ${weeks.length + i + 1}`);
  const handleConfirmInjectPlan = async () => {
    if (!injectPlan || !injectMondayDate) return;
    if (!isAuthed) {
      setAuthError("Sign in to inject plans into your tracker.");
      return;
    }
    const startDate = injectMondayDate;
    const result = await api.injectPlanToWeek({
      planId: injectPlan.id,
      startDate,
      weekLabel: injectWeekLabel,
    });
    const refreshedWeeks = await refreshWeeks();
    if (result && typeof result === "object" && "id" in result) {
      setSelectedWeek(String((result as { id: string }).id));
    } else if (refreshedWeeks && refreshedWeeks[0]) {
      setSelectedWeek(refreshedWeeks[0].id);
    }
    const nextWeekLabel = refreshedWeeks ? `Week ${refreshedWeeks.length + 1}` : `Week ${weeks.length + 1}`;
    setInjectWeekLabel(nextWeekLabel);
    setInjectModalOpen(false);
    setInjectPlan(null);
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError("Google sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut();
      setProfileOpen(false);
      setProfileDetailsOpen(false);
    } catch (error) {
      setAuthError("Sign-out failed. Please try again.");
    }
  };

  const handleProfileSave = async () => {
    setAuthError(null);
    if (!isAuthed) {
      setAuthError("Sign in to update your profile.");
      return;
    }
    const profile = await api.upsertUserProfile({
      displayName: profileNameDraft || undefined,
      photoURL: profilePhotoDraft || undefined,
      goalCalories: profileGoalCaloriesDraft === "" ? undefined : Number(profileGoalCaloriesDraft),
      macroPercents: profileMacroPercentsDraft,
    });
    if (profile && typeof profile === "object" && "id" in profile) {
    setUserProfile(profile as UserProfile);
    }
  };

  const handleProgressUpload = async (payload: { date: string; weight: string; file: File }) => {
    if (!isAuthed) {
      setAuthError("Sign in to upload progress.");
      return;
    }
    setProgressLoading(true);
    const formData = new FormData();
    formData.append("date", payload.date);
    if (payload.weight) {
      formData.append("weight", payload.weight);
    }
    formData.append("photo", payload.file, payload.file.name);
    await api.createProgressEntry(formData);
    await refreshProgressEntries();
    setProgressLoading(false);
  };

  const handleProfileCaloriesDigit = (digit: string) => {
    setProfileCaloriesPad(prev => {
      if (prev === null) return prev;
      return `${prev}${digit}`.replace(/^0+(?=\\d)/, "");
    });
  };
  const handleProfileCaloriesBackspace = () => {
    setProfileCaloriesPad(prev => (prev === null ? prev : prev.slice(0, -1)));
  };
  const handleProfileCaloriesClear = () => {
    setProfileCaloriesPad(prev => (prev === null ? prev : ""));
  };
  const handleProfileCaloriesSave = () => {
    if (profileCaloriesPad === null) return;
    setProfileGoalCaloriesDraft(profileCaloriesPad);
    setProfileCaloriesPad(null);
  };
  const profileMacroTotal = profileMacroPercentsDraft.protein
    + profileMacroPercentsDraft.carbs
    + profileMacroPercentsDraft.fat;

  const profileLabel = userProfile?.displayName || user?.displayName || userProfile?.email || user?.email || "Sign in";
  const profileEmail = userProfile?.email || user?.email || "";
  const profilePhoto = userProfile?.photoURL || user?.photoURL || "";
  const profileInitials = profileLabel
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "U";

  const renderAuthGate = (title: string, message: string) => (
    <Section data-component="AuthGateSection">
      <SectionTitle>{title}</SectionTitle>
      <AuthGateCard>
        <AuthGateTitle>Sign in required</AuthGateTitle>
        <AuthGateText>{message}</AuthGateText>
        {!hasConfig && (
          <AuthGateText>Missing Firebase config in the environment.</AuthGateText>
        )}
        <LoadingButton onClick={handleSignIn} disabled={!hasConfig || authLoading}>
          {authLoading && <SpinnerDot />}
          Continue with Google
        </LoadingButton>
        {authError && <AuthGateText>{authError}</AuthGateText>}
      </AuthGateCard>
    </Section>
  );

  const renderCalendarContent = (showClose: boolean, onClose?: () => void) => (
    <>
      <CalendarHeader>
        <CalendarNavButton onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} aria-label="Previous month">
          ‹
        </CalendarNavButton>
        <CalendarTitle>{monthLabel}</CalendarTitle>
        <CalendarNavButton onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} aria-label="Next month">
          ›
        </CalendarNavButton>
      </CalendarHeader>
      <CalendarGrid>
        {calendarWeekdays.map(dayLabel => (
          <CalendarWeekday key={dayLabel}>{dayLabel}</CalendarWeekday>
        ))}
        {calendarDays.map((date: Date) => {
          const dateKey = formatDate(date);
          const isInMonth = date.getMonth() === calendarMonth.getMonth();
          const isSelected = dateKey === selectedDate;
          const hasNutrition = nutritionDates.has(dateKey);
          const hasWorkout = hasWorkoutDay(date);
          return (
            <CalendarDayButton
              key={dateKey}
              $muted={!isInMonth}
              $hasWorkout={hasWorkout}
              $isSelected={isSelected}
              onClick={() => {
                handleCalendarDaySelect(date, onClose);
              }}
            >
              {date.getDate()}
              {hasNutrition && <CalendarDot />}
            </CalendarDayButton>
          );
        })}
      </CalendarGrid>
      <CalendarLegend>
        <LegendItem>
          <LegendSwatch $color={theme.colors.accent} />
          Nutrition logged
        </LegendItem>
        <LegendItem>
          <LegendSwatch $color="rgba(67, 170, 139, 0.12)" />
          Workout week
        </LegendItem>
      </CalendarLegend>
      {showClose && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: theme.spacing.sm }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      )}
    </>
  );

  const renderCalendarDrawer = () => (
    <CalendarDrawerOverlay onClick={() => setCalendarOpen(false)}>
      <CalendarDrawer onClick={e => e.stopPropagation()}>
        {renderCalendarContent(true, () => setCalendarOpen(false))}
      </CalendarDrawer>
    </CalendarDrawerOverlay>
  );

  const renderProfileDrawer = () => (
    <ProfileDrawerOverlay onClick={() => setProfileOpen(false)}>
      <ProfileDrawer onClick={e => e.stopPropagation()}>
        <DrawerSection>
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerTabList>
            {[
              { label: "Tracker", index: 0 },
              { label: "Nutrition", index: 1 },
              { label: "Plans", index: 2 },
              { label: "Library", index: 3 },
              { label: "Promo", index: 4 },
              { label: "Progress", index: 5 },
            ].map(item => (
              <DrawerTabButton
                key={item.label}
                variant={tab === item.index ? undefined : "secondary"}
                onClick={() => {
                  setTab(item.index);
                  setProfileOpen(false);
                }}
              >
                {item.label}
              </DrawerTabButton>
            ))}
          </DrawerTabList>
        </DrawerSection>
        <DrawerSection>
          <DrawerTitle>Calendar</DrawerTitle>
          {isAuthed ? (
            <Card data-component="CalendarInlineCard">
              {renderCalendarContent(false)}
            </Card>
          ) : (
            <Card data-component="CalendarCollapsedCard">
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Sign in to see your calendar.
              </div>
            </Card>
          )}
        </DrawerSection>
        <DrawerSection>
          <DrawerTitle>Profile</DrawerTitle>
          {isAuthed ? (
            <>
              <ProfileSummaryButton
                data-component="ProfileSummaryCard"
                onClick={() => {
                  setTab(5);
                  setProfileOpen(false);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ProfileAvatar>
                    {profilePhoto ? <img src={profilePhoto} alt={profileLabel} /> : profileInitials}
                  </ProfileAvatar>
                  <div>
                    <div style={{ fontWeight: 700 }}>{profileLabel}</div>
                    {profileEmail && (
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{profileEmail}</div>
                    )}
                  </div>
                </div>
              </ProfileSummaryButton>
              <ProfileFormRow>
                <Button onClick={() => setProfileDetailsOpen(prev => !prev)}>
                  {profileDetailsOpen ? "Hide profile details" : "Edit profile"}
                </Button>
                {profileDetailsOpen && (
                  <>
                    <Label htmlFor="profile-name">Display name</Label>
                    <Input
                      id="profile-name"
                      data-component="ProfileNameInput"
                      value={profileNameDraft}
                      onChange={e => setProfileNameDraft(e.target.value)}
                    />
                    <Label htmlFor="profile-photo">Photo URL</Label>
                    <Input
                      id="profile-photo"
                      data-component="ProfilePhotoInput"
                      value={profilePhotoDraft}
                      onChange={e => setProfilePhotoDraft(e.target.value)}
                    />
                    <Label htmlFor="profile-calories">Goal calories</Label>
                    <ReadOnlyValueButton
                      id="profile-calories"
                      data-component="ProfileGoalCaloriesInput"
                      onClick={() => setProfileCaloriesPad(profileGoalCaloriesDraft || "")}
                    >
                      {profileGoalCaloriesDraft || "0"}
                    </ReadOnlyValueButton>
                    <Label>Macro percents</Label>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {profileMacroTotal === 100
                          ? "Macro split totals 100%"
                          : profileMacroTotal > 100
                            ? `Over by ${profileMacroTotal - 100}%`
                            : `Under by ${100 - profileMacroTotal}%`}
                      </div>
                      <IconButton
                        data-component="MacroEqualizerButton"
                        variant="secondary"
                        onClick={() => setProfileMacroPercentsDraft({ protein: 40, carbs: 40, fat: 20 })}
                        title="Reset to default split"
                      >
                        <EqualizerIcon />
                      </IconButton>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {([
                        { key: "protein", label: "Protein" },
                        { key: "carbs", label: "Carbs" },
                        { key: "fat", label: "Fat" },
                      ] as const).map(item => (
                        <div key={item.key} style={{ display: "grid", gap: 4 }}>
                          <Label>{item.label} {profileMacroPercentsDraft[item.key]}%</Label>
                          <SliderInput
                            min={0}
                            max={100}
                            step={1}
                            value={profileMacroPercentsDraft[item.key]}
                            onChange={e =>
                              setProfileMacroPercentsDraft(prev => ({
                                ...prev,
                                [item.key]: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                <LoadingButton onClick={handleProfileSave} disabled={api.loading}>
                  {api.loading && <SpinnerDot />}
                  Save profile
                </LoadingButton>
                  </>
                )}
                <AuthButton variant="secondary" onClick={handleSignOut}>Sign out</AuthButton>
                {authError && <AuthGateText>{authError}</AuthGateText>}
              </ProfileFormRow>
              {profileCaloriesPad !== null && (
                <NumberPadOverlay onClick={() => setProfileCaloriesPad(null)}>
                  <NumberPadCard onClick={e => e.stopPropagation()}>
                    <div style={{ fontWeight: 700 }}>Goal calories</div>
                    <NumberPadDisplay>{profileCaloriesPad || "0"}</NumberPadDisplay>
                    <NumberPadGrid>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit => (
                        <NumberPadButton key={digit} onClick={() => handleProfileCaloriesDigit(digit)}>
                          {digit}
                        </NumberPadButton>
                      ))}
                      <NumberPadButton variant="secondary" onClick={handleProfileCaloriesClear}>C</NumberPadButton>
                      <NumberPadButton onClick={() => handleProfileCaloriesDigit("0")}>0</NumberPadButton>
                      <NumberPadButton variant="secondary" onClick={handleProfileCaloriesBackspace}>⌫</NumberPadButton>
                    </NumberPadGrid>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <Button variant="secondary" onClick={() => setProfileCaloriesPad(null)}>Cancel</Button>
                      <LoadingButton onClick={handleProfileCaloriesSave} disabled={api.loading}>
                        {api.loading && <SpinnerDot />}
                        Done
                      </LoadingButton>
                    </div>
                  </NumberPadCard>
                </NumberPadOverlay>
              )}
            </>
          ) : (
            <AuthGateCard>
              <AuthGateTitle>Sign in</AuthGateTitle>
              <AuthGateText>Use Google to access your tracker, nutrition, and profile.</AuthGateText>
              <Button onClick={handleSignIn} disabled={!hasConfig || authLoading}>
                Continue with Google
              </Button>
              {authError && <AuthGateText>{authError}</AuthGateText>}
            </AuthGateCard>
          )}
        </DrawerSection>
      </ProfileDrawer>
    </ProfileDrawerOverlay>
  );

  // ---- Tracker Section ----
  function renderTracker() {
    if (authLoading) {
      return (
        <Section data-component="FitnessTracker">
          <SectionTitle>Fitness Tracker</SectionTitle>
          <Card data-component="AuthLoadingCard">Checking sign-in status...</Card>
        </Section>
      );
    }
    if (!isAuthed) {
      return renderAuthGate("Fitness Tracker", "Sign in to view and update your training weeks.");
    }
    const week = weeks.find(w => w.id === selectedWeek);
    if (!week) {
      return (
        <Section data-component="FitnessTracker">
          <SectionTitle>Fitness Tracker</SectionTitle>
          <Card data-component="EmptyWeekCard">No weeks yet. Inject a plan to get started.</Card>
        </Section>
      );
    }
    return (
      <Section data-component="FitnessTracker">
        <SectionTitle>{parseDate(week.startDate).getFullYear()} Fitness Tracker</SectionTitle>
        <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 }}>
          Covering {formatReadableDate(parseDate(week.startDate))} - {formatReadableDate(parseDate(week.endDate))}
        </div>
        <Card data-component="WeekSelector">
          <Label htmlFor="week-select">Select Week</Label>
          <select
            id="week-select"
            data-component="WeekSelect"
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 8 }}
          >
            {weeks.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </Card>
        <Card data-component="WeekGrid">
          <WeekTable>
            <thead>
              <tr data-component="WeekTableHead">
                <WeekTableHeadCell></WeekTableHeadCell>
                {sessionTimes.map(t => (
                  <WeekTableHeadCell key={t}>{t}</WeekTableHeadCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map((day, index) => {
                const dayDate = addDays(parseDate(week.startDate), index);
                const dayLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
                return (
                <tr key={day} data-component="WeekTableRow">
                  <WeekTableDayCell>
                    <WeekDayButton onClick={() => setDailyModal({ day, date: dayDate })}>
                      <span>{day}</span>
                      <span style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                        {dayLabel}
                      </span>
                    </WeekDayButton>
                  </WeekTableDayCell>
                {sessionTimes.map(time => {
                    const sessions = (week.sessions || []).filter(s => s.day === day && s.time === time);
                    return (
                      <td key={time} data-component="WeekTableSessionCell">
                        {sessions.length === 0 ? (
                          <SessionCellButton
                            variant="secondary"
                            onClick={() => setSessionModal({ session: null, day, time })}
                            aria-label={`Open session for ${day} ${time}`}
                          >
                            Add
                          </SessionCellButton>
                        ) : (
                          <SessionStack>
                            {sessions.map(session => (
                              <SessionCellButton
                                key={session.id}
                                data-component="SessionCellButton"
                                variant={session.entries.length > 0 ? "primary" : "secondary"}
                                onClick={() => setSessionModal({ session, day, time })}
                                aria-label={`Open session for ${day} ${time}`}
                              >
                                {session.label}
                              </SessionCellButton>
                            ))}
                          </SessionStack>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
              })}
            </tbody>
          </WeekTable>
        </Card>
        {sessionModal && (
          <SessionModal
            session={sessionModal.session}
            day={sessionModal.day}
            time={sessionModal.time}
            onClose={() => setSessionModal(null)}
          />
        )}
        {dailyModal && (
          <DailyViewModal
            week={week}
            day={dailyModal.day}
            date={dailyModal.date}
            onClose={() => setDailyModal(null)}
          />
        )}
      </Section>
    );
  }

  // ---- Session Modal ----
  function DailyViewModal({
    week,
    day,
    date,
    onClose,
  }: {
    week: Week;
    day: string;
    date: Date;
    onClose: () => void;
  }) {
    const [collapsed, setCollapsed] = useState({ am: false, pm: false });
    const daySessions = (week.sessions || []).filter(session => session.day === day);
    const sessionsByTime = {
      AM: daySessions.filter(session => session.time === "AM"),
      PM: daySessions.filter(session => session.time === "PM"),
    };
    const openSession = (session: Session | null, time: "AM" | "PM") => {
      onClose();
      setSessionModal({ session, day, time });
    };
    return (
      <ModalOverlay onClick={onClose}>
        <DailyModal onClick={e => e.stopPropagation()}>
          <DailyModalHeader>
            <SectionTitle>{day}</SectionTitle>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              {date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
            </div>
          </DailyModalHeader>
          <DailyModalBody>
            {(["AM", "PM"] as const).map(time => {
              const timeKey = time.toLowerCase() as "am" | "pm";
              const isCollapsed = collapsed[timeKey];
              const sessions = sessionsByTime[time];
              return (
                <div key={time} style={{ marginBottom: theme.spacing.md }}>
                  <DailyTimeHeader onClick={() => setCollapsed(prev => ({ ...prev, [timeKey]: !prev[timeKey] }))}>
                    <span>{time}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <DailyTimeCount>{sessions.length} session{sessions.length === 1 ? "" : "s"}</DailyTimeCount>
                      {isCollapsed ? <PlusIcon /> : <MinusIcon />}
                    </div>
                  </DailyTimeHeader>
                  {!isCollapsed && (
                    <>
                      {sessions.length === 0 && (
                        <Card data-component="DailyEmptySessionCard">
                          No {time} sessions yet.
                        </Card>
                      )}
                      {sessions.map(session => (
                        <PlanSessionRow key={session.id}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <PlanSessionLabel>{stripSessionTime(session.label) || session.label}</PlanSessionLabel>
                              <PlanExerciseMeta>{session.entries.length} exercises</PlanExerciseMeta>
                            </div>
                            <Button variant="secondary" onClick={() => openSession(session, time)}>
                              Edit
                            </Button>
                          </div>
                        </PlanSessionRow>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </DailyModalBody>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </DailyModal>
      </ModalOverlay>
    );
  }

  function SessionModal({
    session,
    day,
    time,
    onClose,
  }: {
    session: Session | null;
    day: string;
    time: string;
    onClose: () => void;
  }) {
    // Local draft state for editing entry progress before saving.
    const [entries, setEntries] = useState<ExerciseEntry[]>(session ? session.entries : []);
    const [adding, setAdding] = useState(false);
    const [newExerciseId, setNewExerciseId] = useState("");
    const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(
      new Set(session ? session.entries.map(entry => entry.id) : [])
    );
    const [numberPad, setNumberPad] = useState<{
      entryId: string;
      setIndex: number;
      field: "actualReps" | "rpe" | "actualDuration";
      value: string;
    } | null>(null);
    const [newSets, setNewSets] = useState<Array<{
      weight: string;
      reps: string;
      rpe: string;
      durationValue: string;
      durationUnit: string;
    }>>([{ weight: "", reps: "", rpe: "", durationValue: "", durationUnit: "min" }]);

    function addEntry() {
      if (!newExerciseId || !session) return;
      setEntries([
        ...entries,
        {
          id: uid("entry"),
          sessionId: session.id,
          exerciseId: newExerciseId,
          sets: newSets.map(s => {
            const durationValue = s.durationValue === "" ? null : Number(s.durationValue) || 0;
            return {
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              rpe: s.rpe === "" ? undefined : Number(s.rpe) || 0,
              ...(durationValue !== null ? { duration: { value: durationValue, unit: s.durationUnit || "min" } } : {}),
            };
          }),
        },
      ]);
      setAdding(false);
      setNewExerciseId("");
      setNewSets([{ weight: "", reps: "", rpe: "", durationValue: "", durationUnit: "min" }]);
    }
    function removeEntry(idx: number) {
      setEntries(entries.filter((_, i) => i !== idx));
    }
    const toggleEntryCollapsed = (entryId: string) => {
      setCollapsedEntries(prev => {
        const next = new Set(prev);
        if (next.has(entryId)) {
          next.delete(entryId);
        } else {
          next.add(entryId);
        }
        return next;
      });
    };
    const updateEntrySet = (
      entryId: string,
      setIndex: number,
      field: "actualReps" | "rpe" | "actualDuration",
      value: string
    ) => {
      setEntries(prev =>
        prev.map(entry => {
          if (entry.id !== entryId) return entry;
          const nextSets = entry.sets.map((set, idx) => {
            if (idx !== setIndex) return set;
            const nextValue = value === "" ? undefined : Number(value);
            if (field === "actualReps") {
              return { ...set, actualReps: nextValue };
            }
            if (field === "actualDuration") {
              return { ...set, actualDuration: nextValue };
            }
            return { ...set, rpe: nextValue };
          });
          return { ...entry, sets: nextSets };
        })
      );
    };
    const openNumberPad = (entryId: string, setIndex: number, field: "actualReps" | "rpe" | "actualDuration") => {
      const entry = entries.find(item => item.id === entryId);
      const currentValue = entry?.sets[setIndex]?.[field];
      setNumberPad({
        entryId,
        setIndex,
        field,
        value: currentValue === undefined || currentValue === null ? "" : String(currentValue),
      });
    };
    const handleNumberPress = (digit: string) => {
      setNumberPad(prev => {
        if (!prev) return prev;
        const next = `${prev.value}${digit}`.replace(/^0+(?=\\d)/, "");
        if (prev.field === "rpe") {
          const num = Number(next);
          if (Number.isNaN(num) || num > 9) {
            return prev;
          }
        }
        return { ...prev, value: next };
      });
    };
    const handleNumberBackspace = () => {
      setNumberPad(prev => (prev ? { ...prev, value: prev.value.slice(0, -1) } : prev));
    };
    const handleNumberClear = () => {
      setNumberPad(prev => (prev ? { ...prev, value: "" } : prev));
    };
    const handleNumberSave = async () => {
      if (!numberPad) return;
      const currentEntry = entries.find(entry => entry.id === numberPad.entryId);
      if (!currentEntry) {
        setNumberPad(null);
        return;
      }
      const nextValue = numberPad.value === "" ? undefined : Number(numberPad.value);
      const nextSets = currentEntry.sets.map((set, idx) => {
        if (idx !== numberPad.setIndex) return set;
        if (numberPad.field === "actualReps") {
          return { ...set, actualReps: nextValue };
        }
        if (numberPad.field === "actualDuration") {
          return { ...set, actualDuration: nextValue };
        }
        return { ...set, rpe: nextValue };
      });
      setEntries(prev =>
        prev.map(entry => (entry.id === currentEntry.id ? { ...entry, sets: nextSets } : entry))
      );
      await api.updateExerciseEntry(currentEntry.id, nextSets);
      await refreshWeeks();
      setNumberPad(null);
    };
    return (
      <ModalOverlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <SectionTitle>
            {day} {time} Session
          </SectionTitle>
          <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
            {session ? stripSessionTime(session.label) || session.label : "New session"}
          </div>
          {session ? (
            <>
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
                    {exerciseLibrary.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.title}</option>
                    ))}
                  </select>
                  {newSets.map((set, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
                      <Input
                        data-component="SetDurationInput"
                        type="number"
                        placeholder="Duration"
                        value={set.durationValue}
                        onChange={e => {
                          const v = e.target.value;
                          setNewSets(s => s.map((s2, j) => j === i ? { ...s2, durationValue: v } : s2));
                        }}
                      />
                      <select
                        data-component="SetDurationUnitSelect"
                        value={set.durationUnit}
                        onChange={e => {
                          const v = e.target.value;
                          setNewSets(s => s.map((s2, j) => j === i ? { ...s2, durationUnit: v } : s2));
                        }}
                        style={{ height: 48, borderRadius: 12, border: `1px solid ${theme.colors.border}`, padding: '0 8px' }}
                      >
                        <option value="sec">sec</option>
                        <option value="min">min</option>
                        <option value="hr">hr</option>
                      </select>
                    </div>
                  ))}
                  <Button data-component="AddSetButton" variant="secondary" onClick={() => setNewSets([...newSets, { weight: "", reps: "", rpe: "", durationValue: "", durationUnit: "min" }])}>+ Set</Button>
                  <LoadingButton data-component="SaveExerciseButton" onClick={addEntry} disabled={api.loading}>
                    {api.loading && <SpinnerDot />}
                    Save Exercise
                  </LoadingButton>
                  <Button data-component="CancelAddExerciseButton" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
                </Card>
              )}
            </>
          ) : (
            <Card data-component="EmptySessionCard">No session added yet for this slot.</Card>
          )}
          <div data-component="ExerciseTable">
            {entries.length === 0 && <div>No exercises added yet.</div>}
            {entries.map((entry: ExerciseEntry, idx: number) => {
              const ex = exerciseById[entry.exerciseId];
              if (!ex) {
                return null;
              }
              const entryHasDuration = entry.sets.every(set => set.duration && set.duration.value !== undefined);
              const isCollapsed = collapsedEntries.has(entry.id);
              return (
                <Card data-component="ExerciseEntryCard" key={entry.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={ex.image} alt={ex.title} style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <strong>{ex.title}</strong>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{ex.type}</div>
                    </div>
                    <IconButton
                      data-component="ToggleExerciseButton"
                      variant="secondary"
                      onClick={() => toggleEntryCollapsed(entry.id)}
                    >
                      {isCollapsed ? <PlusIcon /> : <MinusIcon />}
                    </IconButton>
                  </div>
                  {isCollapsed ? (
                    <div style={{ marginTop: 12, fontSize: 12, color: theme.colors.textSecondary }}>
                      {entry.sets.length} set{entry.sets.length === 1 ? "" : "s"} • {entryHasDuration ? "Duration" : "Reps"} tracking
                    </div>
                  ) : (
                    <SetTable>
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>{entryHasDuration ? "Duration" : "Weight"}</th>
                          {!entryHasDuration && <th>Reps</th>}
                          <th>RPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.sets.map((set, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                          <td>
                            {entryHasDuration ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", minWidth: 120 }}>
                                <ReadOnlyValueButton
                                  data-component="ActualDurationButton"
                                  onClick={() => openNumberPad(entry.id, i, "actualDuration")}
                                >
                                  {set.actualDuration ?? "—"}
                                </ReadOnlyValueButton>
                                <span
                                  title="Actual duration / target duration (min)"
                                  style={{ display: "inline-flex", alignItems: "center", color: theme.colors.textSecondary }}
                                >
                                  <span style={{ fontSize: 16, lineHeight: 1 }}>/</span>
                                  <span style={{ fontSize: 11, lineHeight: 1, marginLeft: 4 }}>
                                    {durationToMinutes(set.duration) ?? "—"}m
                                  </span>
                                </span>
                              </div>
                            ) : (
                              set.weight
                            )}
                          </td>
                            {!entryHasDuration && (
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", minWidth: 120 }}>
                                  <ReadOnlyValueButton
                                    data-component="ActualRepsButton"
                                    onClick={() => openNumberPad(entry.id, i, "actualReps")}
                                  >
                                    {set.actualReps ?? "—"}
                                  </ReadOnlyValueButton>
                                  <span
                                    title="Actual reps / target reps"
                                    style={{ display: "inline-flex", alignItems: "center", color: theme.colors.textSecondary }}
                                  >
                                    <span style={{ fontSize: 16, lineHeight: 1 }}>/</span>
                                    <span style={{ fontSize: 11, lineHeight: 1, marginLeft: 4 }}>{set.reps}</span>
                                  </span>
                                </div>
                              </td>
                            )}
                            <td>
                              <ReadOnlyValueButton
                                data-component="ActualRpeButton"
                                onClick={() => openNumberPad(entry.id, i, "rpe")}
                              >
                                {set.rpe ?? "—"}
                              </ReadOnlyValueButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </SetTable>
                  )}
                </Card>
              );
            })}
          </div>
          <Button data-component="CloseSessionModalButton" onClick={onClose}>Close</Button>
        </Modal>
        {numberPad && (
          <NumberPadOverlay onClick={() => setNumberPad(null)}>
            <NumberPadCard onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 700 }}>
                {numberPad.field === "rpe"
                  ? "RPE (0-9)"
                  : numberPad.field === "actualDuration"
                    ? "Actual duration (min)"
                    : "Actual reps"}
              </div>
              <NumberPadDisplay>{numberPad.value || "0"}</NumberPadDisplay>
              <NumberPadGrid>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit => (
                  <NumberPadButton key={digit} onClick={() => handleNumberPress(digit)}>
                    {digit}
                  </NumberPadButton>
                ))}
                <NumberPadButton variant="secondary" onClick={handleNumberClear}>C</NumberPadButton>
                <NumberPadButton onClick={() => handleNumberPress("0")}>0</NumberPadButton>
                <NumberPadButton variant="secondary" onClick={handleNumberBackspace}>⌫</NumberPadButton>
              </NumberPadGrid>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button variant="secondary" onClick={() => setNumberPad(null)}>Cancel</Button>
                  <LoadingButton onClick={handleNumberSave} disabled={api.loading}>
                    {api.loading && <SpinnerDot />}
                    Done
                  </LoadingButton>
              </div>
            </NumberPadCard>
          </NumberPadOverlay>
        )}
      </ModalOverlay>
    );
  }

  // ---- Nutrition Section ----
  function renderNutrition() {
    if (authLoading) {
      return (
        <Section data-component="NutritionTracker">
          <SectionTitle>Nutrition</SectionTitle>
          <Card data-component="AuthLoadingCard">Checking sign-in status...</Card>
        </Section>
      );
    }
    if (!isAuthed) {
      return renderAuthGate("Nutrition", "Sign in to view and update your nutrition logs.");
    }
    const selectedNutritionDay = nutritionDays.find(d => d.date === selectedDate);
    const nutritionBase = selectedNutritionDay || {
      calories: 0,
      macroPercents: { ...defaultMacroPercents },
      meals: [],
    };
    const macroPercents: MacroPercents = userProfile?.macroPercents || defaultMacroPercents;
    const meals = Array.isArray(nutritionBase.meals) ? nutritionBase.meals : [];
    const goalCalories = userProfile?.goalCalories || 0;
    const goalMacros = gramsFromPercents(goalCalories, macroPercents);
    const { prev: prevNutritionDate, next: nextNutritionDate } = getAdjacentNutritionDates(selectedDate);
    const totalCalories = Number(goalCalories) || 0;
    const percentUsed = macroPercents.protein + macroPercents.carbs + macroPercents.fat;
    const percentRemaining = Math.max(0, 100 - percentUsed);
    const caloriesRemaining = Math.round((totalCalories * percentRemaining) / 100);
    const percentOver = Math.max(0, percentUsed - 100);
    const caloriesOver = Math.round((totalCalories * percentOver) / 100);
    const macroSliders: Array<{ key: MacroKey; label: string; caloriesPerGram: number }> = [
      { key: "protein", label: "Protein", caloriesPerGram: 4 },
      { key: "carbs", label: "Carbs", caloriesPerGram: 4 },
      { key: "fat", label: "Fat", caloriesPerGram: 9 },
    ];
    const mealsForDay = mealTypes.map(type => meals.find(m => m.type === type) || {
      macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    });
    const totalMealMacros = mealsForDay.reduce<{ protein: number; carbs: number; fat: number }>((acc, meal) => {
      mealMacroKeys.forEach((key: MacroKey) => {
        acc[key] += Number(meal.macros[key]) || 0;
      });
      return acc;
    }, { protein: 0, carbs: 0, fat: 0 });
    const totalMealGrams = totalMealMacros.protein + totalMealMacros.carbs + totalMealMacros.fat;
    const totalGoalGrams = (Number(goalMacros.protein) || 0)
      + (Number(goalMacros.carbs) || 0)
      + (Number(goalMacros.fat) || 0);
    const percentBaseCalories = totalCalories;
    const totalMealCaloriesFromMacros = (totalMealMacros.protein * 4)
      + (totalMealMacros.carbs * 4)
      + (totalMealMacros.fat * 9);
    const handleMealMacroChange = (type: string, key: MacroKey, value: string) => {
      const nextValue = Number(value) || 0;
      const goalValue = Number(goalMacros[key]) || 0;
      const adjustedValue = nutritionUnit === "percent" && goalValue > 0
        ? roundToTenth((goalValue * nextValue) / 100)
        : nextValue;
      upsertNutritionDay(selectedDate, prevDay => ({
        ...prevDay,
        meals: prevDay.meals.map(meal => (
          meal.type === type
            ? { ...meal, macros: { ...meal.macros, [key]: adjustedValue } }
            : meal
        )),
      }));
    };
    const openMacroSliderPad = (type: string, key: MacroKey, value: number) => {
      setMacroSliderPad({
        mealType: type,
        macroKey: key,
        value,
      });
    };
    const handleMacroSliderSave = () => {
      if (!macroSliderPad) return;
      handleMealMacroChange(
        macroSliderPad.mealType,
        macroSliderPad.macroKey,
        String(macroSliderPad.value)
      );
      setMacroSliderPad(null);
    };
    const formatMealValue = (key: MacroKey, value: number) => {
      if (nutritionUnit !== "percent") {
        return value;
      }
      const goalValue = Number(goalMacros[key]) || 0;
      if (goalValue <= 0) {
        return 0;
      }
      return roundToTenth((Number(value) || 0) / goalValue * 100);
    };
    const formatSummaryValue = (key: MacroKey, value: number) => {
      if (nutritionUnit !== "percent") {
        return value;
      }
      const goalValue = Number(goalMacros[key]) || 0;
      if (goalValue <= 0) {
        return 0;
      }
      return roundToTenth((Number(value) || 0) / goalValue * 100);
    };
    const addNutritionDate = async () => {
      const exists = nutritionDays.some(d => d.date === selectedDate);
      if (exists) return;
      const dayId = uid("nd");
      const newDay = {
        id: dayId,
        date: selectedDate,
        calories: goalCalories,
        macroPercents: { ...macroPercents },
        meals: mealTypes.map(type => ({
          id: uid("meal"),
          dayId,
          type,
          macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        })),
      };
      await api.upsertNutritionDay({ date: selectedDate, patch: newDay });
      await refreshNutritionDays();
      setCalendarMonth(parseDate(selectedDate));
    };
    return (
      <Section data-component="NutritionTracker">
        <SectionTitle>Nutrition</SectionTitle>
        <Card data-component="NutritionDateControls">
          <Label htmlFor="nutrition-date">Nutrition Date</Label>
          <Input
            id="nutrition-date"
            data-component="NutritionDateInput"
            type="date"
            value={selectedDate}
            onChange={e => handleSelectDate(e.target.value)}
          />
          <DatePager>
            <DatePagerButton
              variant="secondary"
              onClick={() => prevNutritionDate && handleSelectDate(prevNutritionDate)}
              disabled={!prevNutritionDate}
            >
              Prev
            </DatePagerButton>
            <LoadingButton
              data-component="AddNutritionDateButton"
              variant="secondary"
              onClick={addNutritionDate}
            >
              {api.loading && <SpinnerDot />}
              Add Date
            </LoadingButton>
            <DatePagerButton
              variant="secondary"
              onClick={() => nextNutritionDate && handleSelectDate(nextNutritionDate)}
              disabled={!nextNutritionDate}
            >
              Next
            </DatePagerButton>
          </DatePager>
        </Card>
        <Card data-component="MacroGoalsHeader">
          <MacroSummary>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <MacroLabel>Goal Macros</MacroLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant={nutritionUnit === "grams" ? undefined : "secondary"}
                  onClick={() => setNutritionUnit("grams")}
                >
                  Grams
                </Button>
                <Button
                  variant={nutritionUnit === "percent" ? undefined : "secondary"}
                  onClick={() => setNutritionUnit("percent")}
                >
                  Percent
                </Button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {macroSliders.map(slider => {
                const currentPercent = macroPercents[slider.key];
                const grams = slider.caloriesPerGram === 0
                  ? 0
                  : Math.round(((totalCalories * currentPercent) / 100) / slider.caloriesPerGram);
                const value = nutritionUnit === "percent" ? currentPercent : grams;
                const unitLabel = nutritionUnit === "percent" ? "%" : "g";
                const accent = slider.key === "protein"
                  ? theme.colors.success
                  : slider.key === "carbs"
                    ? theme.colors.accent
                    : theme.colors.accent2;
                return (
                  <div
                    key={slider.key}
                    style={{
                      display: "grid",
                      gap: 4,
                      flex: `${Math.max(currentPercent, 1)} 1 0`,
                      padding: theme.spacing.sm,
                      borderRadius: theme.radii.card,
                      border: `1px solid ${theme.colors.border}`,
                      background: `linear-gradient(135deg, ${accent}15, ${theme.colors.card})`,
                    }}
                  >
                    <div style={{ fontSize: 12, color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {slider.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{value}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{unitLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: "grid",
                gap: 6,
                padding: theme.spacing.sm,
                borderRadius: theme.radii.card,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ fontSize: 12, color: theme.colors.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Goal Calories
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{goalCalories}</div>
                <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>kcal</div>
              </div>
            </div>
            {percentRemaining > 0 && (
              <div style={{ color: theme.colors.danger, fontSize: 12 }}>
                {nutritionUnit === "percent"
                  ? `${percentRemaining}% remaining • ${caloriesRemaining} kcal unassigned`
                  : `${caloriesRemaining} kcal remaining`}
              </div>
            )}
            {percentOver > 0 && (
              <div style={{ color: theme.colors.accent, fontSize: 12 }}>
                {nutritionUnit === "percent"
                  ? `${percentOver}% over • ${caloriesOver} kcal over target`
                  : `${caloriesOver} kcal over target`}
              </div>
            )}
          </MacroSummary>
        </Card>
        <Card data-component="MealTable">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Meals</strong>
          </div>
          <table data-component="MealTableTable" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Meal</th>
                {mealMacroKeys.map((k: MacroKey) => <th key={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</th>)}
                <th>Total {nutritionUnit === "percent" ? "(%)" : "(g)"}</th>
              </tr>
            </thead>
            <tbody>
              {mealTypes.map((type, index) => {
                const meal = mealsForDay[index];
                const mealMacroCalories = (Number(meal.macros.protein) || 0) * 4
                  + (Number(meal.macros.carbs) || 0) * 4
                  + (Number(meal.macros.fat) || 0) * 9;
                const mealTotalGrams = (Number(meal.macros.protein) || 0)
                  + (Number(meal.macros.carbs) || 0)
                  + (Number(meal.macros.fat) || 0);
                const mealTotalDisplay = nutritionUnit === "percent" && percentBaseCalories > 0
                  ? Math.round((mealMacroCalories / percentBaseCalories) * 100)
                  : Math.round(mealTotalGrams);
                return (
                  <tr key={type}>
                    <td>{type}</td>
                    {mealMacroKeys.map((k: MacroKey) => {
                      const value = formatMealValue(k, meal.macros[k]);
                      return (
                        <td key={k}>
                          <ReadOnlyValueButton
                            data-component={`MealInput-${type}-${k}`}
                            onClick={() => openMacroSliderPad(type, k, value)}
                            style={{ width: 60, fontSize: 14, padding: 4, height: 32 }}
                          >
                            {value}{nutritionUnit === "percent" ? "%" : "g"}
                          </ReadOnlyValueButton>
                        </td>
                      );
                    })}
                    <td>{mealTotalDisplay}{nutritionUnit === "percent" ? "%" : "g"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Remaining</strong></td>
                {mealMacroKeys.map((k: MacroKey) => {
                  const remaining = Math.max(0, (Number(goalMacros[k]) || 0) - (Number(totalMealMacros[k]) || 0));
                  const remainingDisplay = formatSummaryValue(k, remaining);
                  return (
                    <td key={k}>
                      <strong>{remainingDisplay}{nutritionUnit === "percent" ? "%" : ""}</strong>
                    </td>
                  );
                })}
                <td>
                  <strong>
                    {nutritionUnit === "percent" && percentBaseCalories > 0
                      ? `${Math.max(0, Math.round(((percentBaseCalories - totalMealCaloriesFromMacros) / percentBaseCalories) * 100))}%`
                      : `${Math.max(0, Math.round(totalGoalGrams - totalMealGrams))}g`}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
          {macroSliderPad && (
            <NumberPadOverlay onClick={() => setMacroSliderPad(null)}>
              <NumberPadCard onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700 }}>
                  {macroSliderPad.macroKey.charAt(0).toUpperCase() + macroSliderPad.macroKey.slice(1)} (
                  {nutritionUnit === "percent" ? "%" : "g"})
                </div>
                <NumberPadDisplay>
                  {macroSliderPad.value}{nutritionUnit === "percent" ? "%" : "g"}
                </NumberPadDisplay>
                <SliderInput
                  min={0}
                  max={nutritionUnit === "percent" ? 100 : 200}
                  step={nutritionUnit === "percent" ? 1 : 1}
                  value={macroSliderPad.value}
                  onChange={e =>
                    setMacroSliderPad(prev =>
                      prev ? { ...prev, value: Number(e.target.value) || 0 } : prev
                    )
                  }
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button variant="secondary" onClick={() => setMacroSliderPad(null)}>Cancel</Button>
                  <LoadingButton onClick={handleMacroSliderSave} disabled={api.loading}>
                    {api.loading && <SpinnerDot />}
                    Done
                  </LoadingButton>
                </div>
              </NumberPadCard>
            </NumberPadOverlay>
          )}
        </Card>
      </Section>
    );
  }

  function renderProgress() {
    if (authLoading) {
      return (
        <Section data-component="FitnessProgress">
          <SectionTitle>Fitness Progress</SectionTitle>
          <Card data-component="AuthLoadingCard">Checking sign-in status...</Card>
        </Section>
      );
    }
    if (!isAuthed) {
      return renderAuthGate("Fitness Progress", "Sign in to track your progress photos and weigh-ins.");
    }
    return (
      <FitnessProgressTab
        theme={theme}
        entries={progressEntries}
        loading={progressLoading || api.loading}
        onUpload={handleProgressUpload}
      />
    );
  }

  // ---- Plans Section ----
  function renderPlans() {
    const plansForCategory = plans.filter(p => p.category === planCategory);
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
        {plansForCategory.map(plan => (
          <Card data-component="PlanCard" key={plan.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <strong>{plan.title}</strong>
                <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{plan.description}</div>
              </div>
              <Button
                data-component="ViewPlanButton"
                onClick={() => {
                  setSelectedPlan(plan);
                  setPlanDayFilter("All");
                  setPlanTimeFilters({ am: true, pm: true });
                  setPlanTypeFilters([]);
                  setPlanYogaFilters([]);
                  setPlanFiltersOpen(false);
                }}
              >
                View
              </Button>
            </div>
          </Card>
        ))}
        </div>
        {selectedPlan && (
          <ModalOverlay onClick={() => setSelectedPlan(null)}>
            <PlanModal onClick={e => e.stopPropagation()}>
              <SectionTitle>{selectedPlan.title}</SectionTitle>
              <div style={{ marginBottom: 8 }}>{selectedPlan.description}</div>
              <PlanFilterRow>
                <PlanFilterLabel>Day</PlanFilterLabel>
                <select
                  data-component="PlanDayFilter"
                  value={planDayFilter}
                  onChange={e => setPlanDayFilter(e.target.value)}
                  style={{ height: 32, borderRadius: 8, border: `1px solid ${theme.colors.border}`, padding: '0 8px' }}
                >
                  <option value="All">All</option>
                  {selectedPlan.chart.map(day => (
                    <option key={day.day} value={day.day}>{day.day}</option>
                  ))}
                </select>
                <PlanFilterLabel>Time</PlanFilterLabel>
                <PlanFilterToggle
                  variant={planTimeFilters.am ? undefined : "secondary"}
                  onClick={() => setPlanTimeFilters(prev => ({ ...prev, am: !prev.am }))}
                >
                  AM
                </PlanFilterToggle>
                <PlanFilterToggle
                  variant={planTimeFilters.pm ? undefined : "secondary"}
                  onClick={() => setPlanTimeFilters(prev => ({ ...prev, pm: !prev.pm }))}
                >
                  PM
                </PlanFilterToggle>
                <PlanFilterToggle
                  variant={planFiltersOpen ? undefined : "secondary"}
                  onClick={() => setPlanFiltersOpen(prev => !prev)}
                >
                  Filters
                </PlanFilterToggle>
              </PlanFilterRow>
              {planFiltersOpen && (() => {
                const allTypes = Array.from(new Set(
                  selectedPlan.chart.flatMap(day => day.sessions.flatMap(sess =>
                    sess.exercises
                      .map(ex => exerciseById[ex.exerciseId])
                      .filter((exercise): exercise is Exercise => Boolean(exercise))
                      .map(exercise => exercise.type)
                  ))
                )).filter(Boolean).sort();
                const allYogaCategories = Array.from(new Set(
                  selectedPlan.chart.flatMap(day => day.sessions.flatMap(sess =>
                    sess.exercises
                      .map(ex => exerciseById[ex.exerciseId])
                      .filter((exercise): exercise is Exercise => Boolean(exercise))
                      .map(exercise => exercise.yogaCategory)
                  ))
                ))
                  .filter((value): value is string => Boolean(value))
                  .sort();
                return (
                  <PlanFilterMenu>
                    <PlanFilterGroup>
                      <PlanFilterLabel>Exercise Type</PlanFilterLabel>
                      <div>
                        {allTypes.map(type => (
                          <PlanFilterOption key={type}>
                            <input
                              type="checkbox"
                              checked={planTypeFilters.includes(type)}
                              onChange={() => setPlanTypeFilters(prev => (
                                prev.includes(type)
                                  ? prev.filter(t => t !== type)
                                  : [...prev, type]
                              ))}
                            />
                            {type}
                          </PlanFilterOption>
                        ))}
                      </div>
                    </PlanFilterGroup>
                    {allYogaCategories.length > 0 && (
                      <PlanFilterGroup>
                        <PlanFilterLabel>Yoga Category</PlanFilterLabel>
                        <div>
                          {allYogaCategories.map(cat => (
                            <PlanFilterOption key={cat}>
                              <input
                                type="checkbox"
                                checked={planYogaFilters.includes(cat)}
                                onChange={() => setPlanYogaFilters(prev => (
                                  prev.includes(cat)
                                    ? prev.filter(c => c !== cat)
                                    : [...prev, cat]
                                ))}
                              />
                              {cat}
                            </PlanFilterOption>
                          ))}
                        </div>
                      </PlanFilterGroup>
                    )}
                  </PlanFilterMenu>
                );
              })()}
              <PlanModalBody>
                {selectedPlan.chart
                  .filter(day => planDayFilter === "All" || day.day === planDayFilter)
                  .map((day, i) => {
                    const filteredSessions = day.sessions.filter(sess => {
                      const timeMatch = sess.label.match(/\b(AM|PM)\b/i);
                      const timeLabel = timeMatch ? timeMatch[1].toUpperCase() : null;
                      const timeFilterActive = planTimeFilters.am || planTimeFilters.pm;
                      const timeMatchOk = !timeFilterActive
                        ? true
                        : (!timeLabel || (timeLabel === "AM" && planTimeFilters.am) || (timeLabel === "PM" && planTimeFilters.pm));
                      if (!timeMatchOk) {
                        return false;
                      }
                      const exercises = sess.exercises
                        .map(ex => exerciseById[ex.exerciseId])
                        .filter(Boolean);
                      if (planTypeFilters.length > 0) {
                        const hasType = exercises.some(ex => planTypeFilters.includes(ex.type));
                        if (!hasType) return false;
                      }
                      if (planYogaFilters.length > 0) {
                        const hasYoga = exercises.some(ex => ex.yogaCategory && planYogaFilters.includes(ex.yogaCategory));
                        if (!hasYoga) return false;
                      }
                      return true;
                    });
                    if (filteredSessions.length === 0) {
                      return null;
                    }
                    return (
                      <PlanDayGroup key={i}>
                        <PlanDayHeader>
                          <PlanDayText>{day.day}</PlanDayText>
                        </PlanDayHeader>
                        {filteredSessions.map((sess, j) => {
                          const timeMatch = sess.label.match(/\b(AM|PM)\b/i);
                          const timeLabel = timeMatch ? timeMatch[1].toUpperCase() : null;
                          return (
                            <PlanSessionRow key={i + '-' + j}>
                              <PlanSessionLabel>
                                {sess.label}
                                {timeLabel && <PlanSessionTime>{timeLabel}</PlanSessionTime>}
                              </PlanSessionLabel>
                              <div>
                                {sess.exercises.map((ex, k) => {
                                  const exObj = exerciseById[ex.exerciseId];
                                  if (!exObj) {
                                    return null;
                                  }
                                  return (
                                    <div key={k} style={{ marginBottom: 6 }}>
                                      <div>{exObj.title}</div>
                                      <PlanExerciseMeta>
                                        {ex.sets ? `Sets: ${ex.sets}` : ''}{ex.reps ? ` • Reps: ${ex.reps}` : ''}{ex.duration ? ` • ${ex.duration.value} ${ex.duration.unit}` : ''}
                                      </PlanExerciseMeta>
                                    </div>
                                  );
                                })}
                              </div>
                            </PlanSessionRow>
                          );
                        })}
                      </PlanDayGroup>
                    );
                  })}
              </PlanModalBody>
              <LoadingButton
                data-component="InjectPlanButton"
                disabled={!isAuthed || authLoading}
                onClick={() => {
                  setInjectPlan(selectedPlan);
                  setInjectWeekLabel(`Week ${weeks.length + 1}`);
                  setInjectMondayDate(formatDate(upcomingMondays[0]));
                  setInjectModalOpen(true);
                }}
              >
                {(api.loading || authLoading) && <SpinnerDot />}
                Inject Plan
              </LoadingButton>
              {!isAuthed && <AuthHint>Sign in to inject this plan into your tracker.</AuthHint>}
              <Button data-component="DownloadPlanButton" variant="secondary" onClick={() => alert('Download as PDF/JSON')}>Download</Button>
              <Button data-component="ClosePlanModalButton" variant="secondary" onClick={() => setSelectedPlan(null)}>Close</Button>
            </PlanModal>
          </ModalOverlay>
        )}
        {injectModalOpen && (
          <ModalOverlay onClick={() => setInjectModalOpen(false)}>
            <InjectModal onClick={e => e.stopPropagation()}>
              <SectionTitle>Inject Plan</SectionTitle>
              <Label htmlFor="inject-week">Choose Week</Label>
              <select
                id="inject-week"
                data-component="InjectWeekSelect"
                value={injectWeekLabel}
                onChange={e => setInjectWeekLabel(e.target.value)}
                style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 12 }}
              >
                {injectWeekLabelOptions.map(label => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
              <Label htmlFor="inject-monday">Start Date (Mondays)</Label>
              <select
                id="inject-monday"
                data-component="InjectMondaySelect"
                value={injectMondayDate}
                onChange={e => setInjectMondayDate(e.target.value)}
                style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 12 }}
              >
                {upcomingMondays.map((date: Date) => (
                  <option key={formatDate(date)} value={formatDate(date)}>
                    {formatReadableDate(date)}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button variant="secondary" onClick={() => setInjectModalOpen(false)}>Cancel</Button>
                <LoadingButton onClick={handleConfirmInjectPlan} disabled={!isAuthed || authLoading || api.loading}>
                  {(api.loading || authLoading) && <SpinnerDot />}
                  Inject
                </LoadingButton>
              </div>
              {!isAuthed && <AuthHint>Sign in to inject plans into your tracker.</AuthHint>}
            </InjectModal>
          </ModalOverlay>
        )}
      </Section>
    );
  }

  // ---- Exercise Library ----
  function renderExerciseLibrary() {
    const exerciseTypes = Array.from(new Set(exerciseLibrary.map(ex => ex.type))).sort();
    const exerciseYogaCategories = Array.from(new Set(
      exerciseLibrary
        .map(ex => ex.yogaCategory)
        .filter((value): value is string => Boolean(value))
    )).sort();
    const searchTerm = librarySearch.trim().toLowerCase();
    const filteredExercises = exerciseLibrary.filter(ex => {
      if (libraryTypeFilters.length > 0 && !libraryTypeFilters.includes(ex.type)) {
        return false;
      }
      if (libraryYogaFilters.length > 0) {
        return ex.yogaCategory && libraryYogaFilters.includes(ex.yogaCategory);
      }
      if (searchTerm) {
        const haystack = [
          ex.title,
          ex.description,
          ex.type,
          ex.yogaCategory || "",
        ].join(" ").toLowerCase();
        return haystack.includes(searchTerm);
      }
      return true;
    });
    return (
      <Section data-component="ExerciseLibrary">
        <SectionTitle>Exercise Library</SectionTitle>
        <Input
          data-component="ExerciseLibrarySearch"
          type="search"
          placeholder="Search exercises"
          value={librarySearch}
          onChange={e => setLibrarySearch(e.target.value)}
        />
        <PlanFilterRow>
          <PlanFilterLabel>Filters</PlanFilterLabel>
          <PlanFilterToggle
            variant={libraryFiltersOpen ? undefined : "secondary"}
            onClick={() => setLibraryFiltersOpen(prev => !prev)}
          >
            Exercises
          </PlanFilterToggle>
          <PlanFilterToggle
            variant="secondary"
            onClick={() => {
              setLibraryTypeFilters([]);
              setLibraryYogaFilters([]);
              setLibrarySearch("");
            }}
          >
            Clear
          </PlanFilterToggle>
        </PlanFilterRow>
        {libraryFiltersOpen && (
          <PlanFilterMenu>
            <PlanFilterGroup>
              <PlanFilterLabel>Exercise Type</PlanFilterLabel>
              <div>
                {exerciseTypes.map(type => (
                  <PlanFilterOption key={type}>
                    <input
                      type="checkbox"
                      checked={libraryTypeFilters.includes(type)}
                      onChange={() => setLibraryTypeFilters(prev => (
                        prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      ))}
                    />
                    {type}
                  </PlanFilterOption>
                ))}
              </div>
            </PlanFilterGroup>
            {exerciseYogaCategories.length > 0 && (
              <PlanFilterGroup>
                <PlanFilterLabel>Yoga Category</PlanFilterLabel>
                <div>
                  {exerciseYogaCategories.map(cat => (
                    <PlanFilterOption key={cat}>
                      <input
                        type="checkbox"
                        checked={libraryYogaFilters.includes(cat)}
                        onChange={() => setLibraryYogaFilters(prev => (
                          prev.includes(cat)
                            ? prev.filter(c => c !== cat)
                            : [...prev, cat]
                        ))}
                      />
                      {cat}
                    </PlanFilterOption>
                  ))}
                </div>
              </PlanFilterGroup>
            )}
          </PlanFilterMenu>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {filteredExercises.map(ex => (
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
    const promo = affiliatePromotions[0];
    if (!promo) {
      return null;
    }
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(promo.url)}`;
    return (
      <Section data-component="AffiliatePromotion">
        <Card data-component="PromotionCard" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, color: theme.colors.accent2, marginBottom: 4 }}>Planet Fitness Promo</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.primary, marginBottom: 6 }}>
            $1/month deal for Nomadic Gym Life
          </div>
          <div style={{ marginBottom: 12 }}>{promo.copy}</div>
          <Button data-component="AffiliateCTAButton" as="a" href={promo.url} target="_blank" rel="noopener noreferrer">
            Get $1/month
          </Button>
          <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 6 }}>{promo.disclosure}</div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6 }}>Scan to open</div>
            <img
              src={qrCodeUrl}
              alt="Planet Fitness QR Code"
              width={110}
              height={110}
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
          <NavTab active={tab === 5} onClick={() => setTab(5)} aria-label="Progress">Progress</NavTab>
        </AppNav>
        <ProfileMenuButton onClick={() => setProfileOpen(true)} aria-label="Open profile menu">
          <ProfileAvatar>
            {profilePhoto ? <img src={profilePhoto} alt={profileLabel} /> : profileInitials}
          </ProfileAvatar>
          <ProfileMenuLabel>{isAuthed ? profileLabel : "Sign in"}</ProfileMenuLabel>
          <HamburgerIcon aria-hidden="true">
            <span />
            <span />
            <span />
          </HamburgerIcon>
        </ProfileMenuButton>
      </AppBar>
      <Main>
        {tab === 0 && renderTracker()}
        {tab === 1 && renderNutrition()}
        {tab === 2 && renderPlans()}
        {tab === 3 && renderExerciseLibrary()}
        {tab === 4 && renderAffiliatePromotion()}
        {tab === 5 && renderProgress()}
      </Main>
      {calendarOpen && renderCalendarDrawer()}
      {profileOpen && renderProfileDrawer()}
      <BottomNav>
        <BottomNavTab active={tab === 0} onClick={() => setTab(0)} aria-label="Fitness Tracker">
          <IconWrapper><TrackerIcon /></IconWrapper>
          Tracker
        </BottomNavTab>
        <BottomNavTab active={tab === 1} onClick={() => setTab(1)} aria-label="Nutrition">
          <IconWrapper><NutritionIcon /></IconWrapper>
          Nutrition
        </BottomNavTab>
        <BottomNavTab active={tab === 2} onClick={() => setTab(2)} aria-label="Plans">
          <IconWrapper><PlansIcon /></IconWrapper>
          Plans
        </BottomNavTab>
        <BottomNavTab active={tab === 3} onClick={() => setTab(3)} aria-label="Library">
          <IconWrapper><LibraryIcon /></IconWrapper>
          Library
        </BottomNavTab>
        <BottomNavTab active={tab === 4} onClick={() => setTab(4)} aria-label="Promo">
          <IconWrapper><PromoIcon /></IconWrapper>
          Promo
        </BottomNavTab>
        <BottomNavTab active={tab === 5} onClick={() => setTab(5)} aria-label="Progress">
          <IconWrapper><ProgressIcon /></IconWrapper>
          Progress
        </BottomNavTab>
      </BottomNav>
    </>
  );
}

export default App;
