"use client";

import { useCallback, useMemo, useState } from "react";
import type { QuizQuestion } from "@/src/types";

export function useQuiz(questions: QuizQuestion[]) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<string[]>(
    questions[0]?.timelineItems ?? [],
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const question = questions[questionIndex];

  const isCorrect = useMemo(() => {
    if (!question) return false;
    if (question.type === "timeline") {
      return JSON.stringify(timelineOrder) === JSON.stringify(question.correctOrder);
    }
    return selectedAnswer === question.correctAnswer;
  }, [question, selectedAnswer, timelineOrder]);

  const moveTimelineItem = useCallback((from: number, direction: -1 | 1) => {
    setTimelineOrder((current) => {
      const to = from + direction;
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (submitted || !question) return;
    setSubmitted(true);
    if (isCorrect) {
      setScore((current) => current + 1);
      setStreak((current) => {
        const next = current + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  }, [isCorrect, question, submitted]);

  const next = useCallback(() => {
    if (questionIndex >= questions.length - 1) return false;
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setTimelineOrder(questions[nextIndex]?.timelineItems ?? []);
    setSubmitted(false);
    return true;
  }, [questionIndex, questions]);

  return {
    question,
    questionIndex,
    selectedAnswer,
    setSelectedAnswer,
    timelineOrder,
    moveTimelineItem,
    submitted,
    isCorrect,
    score,
    bestStreak,
    submit,
    next,
  };
}
