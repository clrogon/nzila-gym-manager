import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Discipline } from "../types";

interface SettingsProps {
  discipline: Discipline;
  toggleDisciplineActive: (discipline: Discipline) => void;
}

export default function Settings({ discipline, toggleDisciplineActive }: SettingsProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState(discipline);

  // Mock ranks and plans
  const [ranks, setRanks] = useState([
    { id: 1, name: "Branco", level: 1 },
    { id: 2, name: "Azul", level: 2 },
  ]);

  const seedRanksForDiscipline = (discipline: Discipline) => {
    setRanks([
      { id: 1, name: "Branco", level: 1 },
      { id: 2, name: "Azul", level: 2 },
      { id: 3, name: "Roxo", level: 3 },
      { id: 4, name: "Preto", level: 4 },
    ]);
  };

  const hasBeltSystem = (name: string) => name.toLowerCase().includes("jiu-jitsu");

  const seedData = [
    { id: 1, name: "Treino A", category: "Martial Arts" },
    { id: 2, name: "Aula B", category: "Martial Arts" },
    { id: 3, name: "Exercício C", category: "Martial Arts" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de {selectedDiscipline.name}</CardTitle>
        <CardDescription>Ajuste as opções e planos desta disciplina</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Ativo/Inativo */}
        <div className="flex items-center justify-between">
          <span>Disciplina Ativa</span>
          <Switch
            checked={selectedDiscipline.is_active}
            onCheckedChange={() => {
              toggleDisciplineActive(selectedDiscipline);
              setSelectedDiscipline({ ...selectedDiscipline, is_active: !selectedDiscipline.is_active });
            }}
          />
        </div>

        {/* Sistema de Graus */}
        {hasBeltSystem(selectedDiscipline.name) && (
          <div className="space-y-2">
            <span>Sistema de Graus</span>
            {ranks.length === 0 ? (
              <Button size="sm" variant="outline" onClick={() => seedRanksForDiscipline(selectedDiscipline)}>
                Criar Graus Padrão
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ranks.map(rank => (
                  <Badge key={rank.id} variant="outline" className="text-xs">{rank.name} (Nível {rank.level})</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Planos Associados */}
        <div className="space-y-2">
          <span>Planos Associados</span>
          <Tabs defaultValue="workouts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workouts">Treinos</TabsTrigger>
              <TabsTrigger value="classes">Aulas</TabsTrigger>
              <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            </TabsList>
            <TabsContent value="workouts">
              {seedData.filter(item => item.category === selectedDiscipline.category).map(item => (
                <div key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {item.name}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="classes">
              {seedData.filter(item => item.category === selectedDiscipline.category).map(item => (
                <div key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                  {item.name}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="exercises">
              {seedData.filter(item => item.category === selectedDiscipline.category).map(item => (
                <div key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                  {item.name}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Configurações Extras */}
        <div className="space-y-2">
          <span>Número máximo de alunos</span>
          <Input
            type="number"
            value={selectedDiscipline.max_students}
            onChange={(e) =>
              setSelectedDiscipline({ ...selectedDiscipline, max_students: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <span>Duração padrão (minutos)</span>
          <Input
            type="number"
            value={selectedDiscipline.default_duration}
            onChange={(e) =>
              setSelectedDiscipline({ ...selectedDiscipline, default_duration: parseInt(e.target.value) })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
