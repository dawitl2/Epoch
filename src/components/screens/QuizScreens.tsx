"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Crown,
  Hourglass,
  Landmark,
  Swords,
  XCircle,
} from "lucide-react";
import { getQuizQuestions, getRegion, modeDetails } from "@/src/data/mockData";
import { useQuiz } from "@/src/hooks/useQuiz";
import type { Difficulty, ModeId, QuizResult, RegionId } from "@/src/types";

const modeIcons = { leaders: Crown, empires: Landmark, wars: Swords, timeline: Hourglass };

type SetupProps = {
  region: RegionId;
  mode: ModeId;
  difficulty: Difficulty;
  count: number;
  onDifficultyChange: (value: Difficulty) => void;
  onCountChange: (value: number) => void;
  onBegin: () => void;
  onBack: () => void;
};

export function QuizSetupScreen({ region, mode, difficulty, count, onDifficultyChange, onCountChange, onBegin, onBack }: SetupProps) {
  const regionData = getRegion(region)!;
  const modeData = modeDetails[mode];
  const Icon = modeIcons[mode];

  return (
    <div className="screen quiz-setup-screen page-enter">
      <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Back to exploration</button>
      <header className="quiz-setup-header">
        <span className="eyebrow">Prepare your round</span>
        <h1>Quiz setup</h1>
        <p>Choose the pace and challenge level for this visit to the archive.</p>
      </header>

      <div className="setup-layout">
        <section className="setup-selection" aria-label="Current selection">
          <span className="setup-selection__number">01</span>
          <div><span>Selected region</span><strong>{regionData.name}</strong><small>{regionData.eyebrow}</small></div>
          <span className="setup-divider" />
          <span className="mode-emblem"><Icon size={25} strokeWidth={1.35} aria-hidden="true" /></span>
          <div><span>Selected mode</span><strong>{modeData.name}</strong><small>{modeData.description}</small></div>
        </section>

        <section className="setup-options">
          <fieldset>
            <legend><span>02</span> Difficulty</legend>
            <div className="segmented-options">
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((item) => (
                <button type="button" key={item} className={difficulty === item ? "is-selected" : ""} onClick={() => onDifficultyChange(item)} aria-pressed={difficulty === item}>
                  <strong>{item}</strong>
                  <small>{item === "Easy" ? "Recognizable clues" : item === "Medium" ? "Balanced context" : "Deeper details"}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend><span>03</span> Question count</legend>
            <div className="count-options">
              {[5, 10, 15].map((item) => (
                <button type="button" key={item} className={count === item ? "is-selected" : ""} onClick={() => onCountChange(item)} aria-pressed={count === item}>
                  <strong>{item}</strong><small>{item === 5 ? "Quick study" : item === 10 ? "Standard round" : "Deep dive"}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="primary-button primary-button--wide" onClick={onBegin}>
            Begin Quiz <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      </div>
    </div>
  );
}

type QuizProps = {
  region: RegionId;
  mode: ModeId;
  difficulty: Difficulty;
  count: number;
  onExit: () => void;
  onComplete: (result: QuizResult) => void;
};

export function QuizScreen({ region, mode, difficulty, count, onExit, onComplete }: QuizProps) {
  const questions = getQuizQuestions(region, mode, count);
  const quiz = useQuiz(questions);
  const regionData = getRegion(region)!;
  const modeData = modeDetails[mode];
  const answerReady = quiz.question.type === "timeline" || Boolean(quiz.selectedAnswer);
  const progress = ((quiz.questionIndex + 1) / questions.length) * 100;

  const handlePrimaryAction = () => {
    if (!quiz.submitted) {
      quiz.submit();
      return;
    }
    if (!quiz.next()) {
      onComplete({ score: quiz.score, total: questions.length, bestStreak: quiz.bestStreak, difficulty, region, mode });
    }
  };

  return (
    <div className="screen quiz-screen page-enter">
      <header className="quiz-topbar">
        <button type="button" className="back-button" onClick={onExit}><ArrowLeft size={16} aria-hidden="true" /> Exit round</button>
        <div className="quiz-context"><span>{regionData.name}</span><i>/</i><span>{modeData.name}</span></div>
        <span className="quiz-count">{quiz.questionIndex + 1}<i>/</i>{questions.length}</span>
      </header>
      <div className="quiz-progress" aria-label={`Question ${quiz.questionIndex + 1} of ${questions.length}`}><span style={{ width: `${progress}%` }} /></div>

      <section className="question-card">
        <div className="question-meta"><span className="eyebrow">Question {String(quiz.questionIndex + 1).padStart(2, "0")}</span><span>{difficulty} · {quiz.question.type === "timeline" ? "Chronology" : quiz.question.type === "image" ? "Portrait study" : "Archive question"}</span></div>

        {quiz.question.type === "image" && (
          <div className="portrait-study" aria-label={quiz.question.imageLabel}>
            <div className="portrait-study__arch"><span>{quiz.question.portraitInitials}</span></div>
            <span className="portrait-study__caption">From the Epoch portrait archive</span>
          </div>
        )}

        <h1>{quiz.question.prompt}</h1>

        {quiz.question.type === "timeline" ? (
          <div className="timeline-question" aria-label="Arrange events chronologically">
            {quiz.timelineOrder.map((item, index) => {
              const correctAtPosition = quiz.submitted && quiz.question.correctOrder?.[index] === item;
              return (
                <div key={item} className={quiz.submitted ? (correctAtPosition ? "is-correct" : "is-incorrect") : ""}>
                  <span className="timeline-number">{index + 1}</span>
                  <span>{item}</span>
                  <span className="timeline-controls">
                    <button type="button" onClick={() => quiz.moveTimelineItem(index, -1)} disabled={index === 0 || quiz.submitted} aria-label={`Move ${item} earlier`}><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => quiz.moveTimelineItem(index, 1)} disabled={index === quiz.timelineOrder.length - 1 || quiz.submitted} aria-label={`Move ${item} later`}><ArrowDown size={16} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="answer-grid">
            {quiz.question.answers?.map((answer, index) => {
              const selected = quiz.selectedAnswer === answer;
              const correct = quiz.question.correctAnswer === answer;
              const state = quiz.submitted ? (correct ? "is-correct" : selected ? "is-incorrect" : "") : selected ? "is-selected" : "";
              return (
                <button type="button" key={answer} className={state} onClick={() => quiz.setSelectedAnswer(answer)} disabled={quiz.submitted} aria-pressed={selected}>
                  <span>{String.fromCharCode(65 + index)}</span><strong>{answer}</strong>
                  {quiz.submitted && correct && <CheckCircle2 size={18} aria-hidden="true" />}
                  {quiz.submitted && selected && !correct && <XCircle size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}

        {quiz.submitted && (
          <div className={`answer-feedback ${quiz.isCorrect ? "is-correct" : "is-incorrect"}`} role="status">
            {quiz.isCorrect ? <CheckCircle2 size={21} aria-hidden="true" /> : <XCircle size={21} aria-hidden="true" />}
            <div>
              <strong>{quiz.isCorrect ? "Correct" : "Not quite"}</strong>
              {!quiz.isCorrect && quiz.question.type !== "timeline" && <span>The correct answer is {quiz.question.correctAnswer}.</span>}
              {!quiz.isCorrect && quiz.question.type === "timeline" && <span>The correct order is {quiz.question.correctOrder?.join(" → ")}.</span>}
              <p>{quiz.question.fact}</p>
            </div>
          </div>
        )}

        <div className="question-footer">
          <span>{quiz.submitted ? `Current score · ${quiz.score}/${quiz.questionIndex + 1}` : "Choose one answer before submitting."}</span>
          <button type="button" className="primary-button" onClick={handlePrimaryAction} disabled={!quiz.submitted && !answerReady}>
            {quiz.submitted ? (quiz.questionIndex === questions.length - 1 ? "View results" : "Next question") : "Submit answer"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

type ResultsProps = {
  result: QuizResult;
  onRetry: () => void;
  onChangeMode: () => void;
  onChangeRegion: () => void;
};

export function ResultsScreen({ result, onRetry, onChangeMode, onChangeRegion }: ResultsProps) {
  const accuracy = Math.round((result.score / result.total) * 100);
  const incorrect = result.total - result.score;
  const xp = result.score * (result.difficulty === "Hard" ? 30 : result.difficulty === "Medium" ? 20 : 12);

  return (
    <div className="screen results-screen page-enter">
      <section className="result-hero">
        <span className="eyebrow">Round complete</span>
        <div className="result-score"><strong>{result.score}</strong><span>/ {result.total}</span></div>
        <h1>{accuracy >= 80 ? "A remarkable reading of the past." : accuracy >= 60 ? "A strong expedition through the archive." : "Every archive visit reveals something new."}</h1>
        <p>{getRegion(result.region)?.name} · {modeDetails[result.mode].name} · {result.difficulty}</p>
      </section>

      <section className="result-ledger">
        <div><span>Correct</span><strong>{result.score}</strong></div>
        <div><span>Incorrect</span><strong>{incorrect}</strong></div>
        <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
        <div><span>Best streak</span><strong>{result.bestStreak}</strong></div>
        <div><span>Mock XP</span><strong>+{xp}</strong></div>
      </section>

      <div className="result-actions">
        <button type="button" className="primary-button" onClick={onRetry}>Try Again <ArrowRight size={17} /></button>
        <button type="button" className="secondary-button" onClick={onChangeMode}>Change Mode</button>
        <button type="button" className="secondary-button" onClick={onChangeRegion}>Explore Another Region</button>
      </div>
    </div>
  );
}

