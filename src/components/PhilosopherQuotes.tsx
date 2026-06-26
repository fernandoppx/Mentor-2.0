import React, { useState } from "react";
import { STRATEGIC_QUOTES } from "../data/quotes";
import { BookOpen, Quote, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";

export default function PhilosopherQuotes() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterAuthor, setFilterAuthor] = useState<string>("all");

  const filteredQuotes = filterAuthor === "all"
    ? STRATEGIC_QUOTES
    : STRATEGIC_QUOTES.filter(q => q.author === filterAuthor);

  const activeQuote = filteredQuotes[currentIndex % filteredQuotes.length] || STRATEGIC_QUOTES[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  const authors = ["all", "Baltasar Gracián", "Sun Tzu", "Nicolau Maquiavel", "Robert Greene"];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          Fundamentação Filosófica
        </h3>
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
          <Bookmark className="w-3 h-3 text-emerald-500/60" />
          {currentIndex + 1} de {filteredQuotes.length}
        </span>
      </div>

      {/* Filter Author Bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-900 pb-3">
        {authors.map((author) => (
          <button
            key={author}
            onClick={() => {
              setFilterAuthor(author);
              setCurrentIndex(0);
            }}
            className={`text-[10px] font-mono px-2 py-1 rounded transition ${
              filterAuthor === author
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            }`}
          >
            {author === "all" ? "Todos" : author.split(" ").pop()}
          </button>
        ))}
      </div>

      {/* Active Quote Display */}
      <div className="flex-1 flex flex-col justify-between min-h-[110px] bg-slate-900/10 p-4 border border-slate-900 rounded-lg relative">
        <Quote className="absolute top-2 right-2 w-8 h-8 text-slate-800/40 pointer-events-none" />
        
        <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium tracking-wide italic">
          "{activeQuote.text}"
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white font-sans">{activeQuote.author}</h4>
            <span className="text-[10px] font-mono text-slate-500">{activeQuote.source}</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={filteredQuotes.length <= 1}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={filteredQuotes.length <= 1}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Próxima"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
