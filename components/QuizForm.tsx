"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { motion } from "framer-motion";

export interface QuizFormProps {
  initialLecture?: number[];
  initialSection?: string;
  initialNumberOfQuestions?: number;
  onSubmit: (data: {
    lecture: string;
    section: string;
    numberOfQuestions: number;
  }) => void;
}

const QuizForm = ({
  initialLecture,
  initialSection,
  initialNumberOfQuestions = 5,
  onSubmit,
}: QuizFormProps) => {
  const [selectedSection, setSelectedSection] = useState<string>(
    initialSection || ""
  );
  const [selectedLecture, setSelectedLecture] = useState<string>(
    initialLecture ? initialLecture[0].toString() : ""
  );
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(
    initialNumberOfQuestions || 3
  );
  const [availableLectures, setAvailableLectures] = useState<
    { value: string; label: string }[]
  >([]);

  // Section data
  const sections = [
    { value: "intensive-1", label: "Intensive 1" },
    { value: "intensive-2", label: "Intensive 2" },
    // { value: "intensive-3", label: "Intensive 3" },
    // { value: "intensive-4", label: "Intensive 4" },
  ];

  // Dynamic lectures based on section
  useEffect(() => {
    if (selectedSection === "intensive-1") {
      setAvailableLectures([
        { value: "1", label: "Day 1" },
        { value: "2", label: "Day 2" },
        { value: "3", label: "Day 3" },
        { value: "4", label: "Day 4" },
        { value: "5", label: "Day 5" },
        { value: "6", label: "Day 6" },
        { value: "7", label: "Day 7" },
        { value: "8", label: "Day 8" },
        { value: "9", label: "Day 9" },
        { value: "10", label: "Day 10" },
      ]);
    } else if (selectedSection === "intensive-2") {
      setAvailableLectures([
        { value: "1", label: "Day 1" },
        { value: "2", label: "Day 2" },
        { value: "3", label: "Day 3" },
        { value: "4", label: "Day 4" },
        { value: "5", label: "Day 5" },
        { value: "6", label: "Day 6" },
        { value: "7", label: "Day 7" },
        { value: "8", label: "Day 8" },
        { value: "9", label: "Day 9" },
        { value: "10", label: "Day 10" },
      ]);
    }
    // else if (selectedSection === "intensive-3") {
    //   setAvailableLectures([
    //     { value: "3", label: "Day 3" },
    //     { value: "4", label: "Day 4" },
    //   ]);
    // } else if (selectedSection === "intensive-4") {
    //   setAvailableLectures([
    //     { value: "4", label: "Day 4" },
    //     { value: "5", label: "Day 5" },
    //   ]);
    // } else if (selectedSection === "frontend") {
    //   setAvailableLectures([
    //     { value: "1", label: "Day 1" },
    //     { value: "5", label: "Day 5" },
    //   ]);
    // } else {
    //   setAvailableLectures([
    //     { value: "1", label: "Day 1" },
    //     { value: "2", label: "Day 2" },
    //     { value: "3", label: "Day 3" },
    //     { value: "4", label: "Day 4" },
    //     { value: "5", label: "Day 5" },
    //   ]);
    // }

    // Reset selected lecture if it's not in the available lectures
    if (selectedSection && selectedLecture) {
      const lectureExists = availableLectures.some(
        (l) => l.value === selectedLecture
      );
      if (!lectureExists && availableLectures.length > 0) {
        setSelectedLecture(availableLectures[0].value);
      }
    }
  }, [selectedSection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      lecture: selectedLecture,
      section: selectedSection,
      numberOfQuestions,
    });
  };

  return (
    <motion.div
      className="rounded-xl border border-zinc-700 bg-dark-200 p-5"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <h3 className="mb-4 text-lg font-medium text-white">
        Complete Quiz Details
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="section" className="text-white">
            Section
          </Label>
          <Select
            value={selectedSection}
            onValueChange={(value) => {
              setSelectedSection(value);
              // Reset lecture when section changes
              if (availableLectures.length > 0) {
                setSelectedLecture(availableLectures[0].value);
              }
            }}
            required
          >
            <SelectTrigger className="border-zinc-700 bg-dark-300 text-white">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent className="bg-dark-200 text-white">
              {sections.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lecture" className="text-white">
            Lecture Day
          </Label>
          <Select
            value={selectedLecture}
            onValueChange={setSelectedLecture}
            required
            disabled={availableLectures.length === 0}
          >
            <SelectTrigger className="border-zinc-700 bg-dark-300 text-white">
              <SelectValue placeholder="Select lecture day" />
            </SelectTrigger>
            <SelectContent className="bg-dark-200 text-white">
              {availableLectures.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfQuestions" className="text-white">
            Number of Questions
          </Label>
          <Input
            id="numberOfQuestions"
            type="number"
            min={1}
            max={10}
            value={numberOfQuestions}
            onChange={(e) =>
              setNumberOfQuestions(parseInt(e.target.value) || 5)
            }
            className="border-zinc-700 bg-dark-300 text-white"
            required
          />
        </div>

        <Button type="submit" className="w-full bg-primary-100 text-white">
          Create Quiz
        </Button>
      </form>
    </motion.div>
  );
};

export default QuizForm;
