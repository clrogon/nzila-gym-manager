import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisciplinesList, Discipline } from "../types";
import Settings from "./Settings";

const seedData: Discipline[] = [
  { id: 1, name: "Jiu-Jitsu", category: "Martial Arts", is_active: true, max_students: 20, default_duration: 60 },
  { id: 2, name: "Crossfit", category: "Fitness", is_active: true, max_students: 15, default_duration: 45 },
  { id: 3, name: "Yoga", category: "Wellness", is_active: false, max_students: 25, default_duration: 60 },
];

export default function Disciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Mock fetch
    setDisciplines(seedData);
  }, []);

  const toggleDisciplineActive = (discipline: Discipline) => {
    setDisciplines(prev =>
      prev.map(d => d.id === discipline.id ? { ...d, is_active: !d.is_active } : d)
    );
    if (selectedDiscipline?.id === discipline.id) {
      setSelectedDiscipline({ ...discipline, is_active: !discipline.is_active });
    }
  };

  return (
    <div className="p-4 flex gap-6">
      {/* Lista de Disciplinas */}
      <div className="w-1/3 space-y-4">
        <Input
          placeholder="Pesquisar disciplina..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {disciplines
          .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
          .map(d => (
            <Card
              key={d.id}
              className={`cursor-pointer ${selectedDiscipline?.id === d.id ? "border-primary" : ""}`}
              onClick={() => setSelectedDiscipline(d)}
            >
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
                <CardDescription>
                  {d.category} - {d.is_active ? <Badge variant="secondary">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
      </div>

      {/* Painel de Settings */}
      <div className="flex-1">
        {selectedDiscipline ? (
          <Settings
            discipline={selectedDiscipline}
            toggleDisciplineActive={toggleDisciplineActive}
          />
        ) : (
          <Card>
            <CardContent>
              Selecione uma disciplina para ver as configurações
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
