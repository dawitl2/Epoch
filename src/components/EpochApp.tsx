"use client";

import { useState } from "react";
import { AppShell, type PrimaryView } from "@/src/components/layout/AppShell";
import { HomeScreen } from "@/src/components/screens/HomeScreen";
import { ModesScreen } from "@/src/components/screens/ModesScreen";
import { ProgressScreen } from "@/src/components/screens/ProgressScreen";
import { QuizScreen, QuizSetupScreen, ResultsScreen } from "@/src/components/screens/QuizScreens";
import { RegionsScreen } from "@/src/components/screens/RegionsScreen";
import type { Difficulty, ModeId, QuizResult, RegionId } from "@/src/types";

type View = PrimaryView | "quiz-setup" | "quiz" | "results";

export function EpochApp() {
  const [view, setView] = useState<View>("home");
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizKey, setQuizKey] = useState(0);

  const navigate = (next: PrimaryView) => setView(next);

  const chooseMode = (mode: ModeId) => {
    setSelectedMode(mode);
    if (selectedRegion) setView("quiz-setup");
  };

  const beginQuiz = () => {
    setQuizKey((value) => value + 1);
    setView("quiz");
  };

  const activeView: PrimaryView | "quiz" =
    view === "home" || view === "regions" || view === "modes" || view === "progress" ? view : "quiz";

  return (
    <AppShell activeView={activeView} onNavigate={navigate}>
      {view === "home" && (
        <HomeScreen
          selectedRegion={selectedRegion}
          selectedMode={selectedMode}
          onRegionSelect={setSelectedRegion}
          onModeSelect={chooseMode}
          onContinue={() => selectedRegion && selectedMode && setView("quiz-setup")}
        />
      )}
      {view === "regions" && (
        <RegionsScreen
          selectedRegion={selectedRegion}
          onRegionSelect={setSelectedRegion}
          onContinue={() => {
            if (!selectedRegion) setSelectedRegion("africa");
            setView(selectedMode ? "quiz-setup" : "home");
          }}
        />
      )}
      {view === "modes" && (
        <ModesScreen
          selectedMode={selectedMode}
          hasRegion={Boolean(selectedRegion)}
          onModeSelect={chooseMode}
          onContinue={() => selectedMode && setView(selectedRegion ? "quiz-setup" : "regions")}
        />
      )}
      {view === "progress" && <ProgressScreen />}
      {view === "quiz-setup" && selectedRegion && selectedMode && (
        <QuizSetupScreen
          region={selectedRegion}
          mode={selectedMode}
          difficulty={difficulty}
          count={questionCount}
          onDifficultyChange={setDifficulty}
          onCountChange={setQuestionCount}
          onBegin={beginQuiz}
          onBack={() => setView("home")}
        />
      )}
      {view === "quiz" && selectedRegion && selectedMode && (
        <QuizScreen
          key={quizKey}
          region={selectedRegion}
          mode={selectedMode}
          difficulty={difficulty}
          count={questionCount}
          onExit={() => setView("quiz-setup")}
          onComplete={(nextResult) => { setResult(nextResult); setView("results"); }}
        />
      )}
      {view === "results" && result && (
        <ResultsScreen
          result={result}
          onRetry={beginQuiz}
          onChangeMode={() => setView("modes")}
          onChangeRegion={() => setView("regions")}
        />
      )}
    </AppShell>
  );
}

