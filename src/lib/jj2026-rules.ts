/**
 * Regulamento Geral dos Jogos da Juventude 2026 (COB)
 * Dados extraídos do PDF oficial para seed do sistema.
 */

// ─── Faixa etária por modalidade (Art 12 / Art 32) ───
export interface JJ2026AgeRange {
  birthYearMin: number; // ano mais antigo (mais velhos)
  birthYearMax: number; // ano mais recente (mais novos)
  ageLabel: string;
}

export const JJ2026_DEFAULT_AGE: JJ2026AgeRange = {
  birthYearMin: 2009,
  birthYearMax: 2011,
  ageLabel: "15 a 17 anos",
};

/** Exceções do Art 12 – modalidades com faixa etária diferente */
export const JJ2026_AGE_EXCEPTIONS: Record<string, JJ2026AgeRange> = {
  "Águas Abertas": { birthYearMin: 2010, birthYearMax: 2012, ageLabel: "14 a 16 anos" },
  Judô: { birthYearMin: 2010, birthYearMax: 2012, ageLabel: "14 a 16 anos" },
  Natação: { birthYearMin: 2010, birthYearMax: 2012, ageLabel: "14 a 16 anos" },
  Wrestling: { birthYearMin: 2010, birthYearMax: 2012, ageLabel: "14 a 16 anos" },
  "Esgrima Espada": { birthYearMin: 2009, birthYearMax: 2012, ageLabel: "14 a 17 anos" },
  "Ginástica Artística Masculina": { birthYearMin: 2009, birthYearMax: 2012, ageLabel: "14 a 17 anos" },
  "Remo Virtual": { birthYearMin: 2009, birthYearMax: 2012, ageLabel: "14 a 17 anos" },
  "Ginástica Artística Feminina": { birthYearMin: 2011, birthYearMax: 2013, ageLabel: "13 a 15 anos" },
  "Ginástica Rítmica": { birthYearMin: 2011, birthYearMax: 2012, ageLabel: "14 e 15 anos" },
  "Tênis de Mesa": { birthYearMin: 2011, birthYearMax: 2012, ageLabel: "14 e 15 anos" },
};

// ─── Limites de atletas por modalidade (Art 21) ───
export interface JJ2026ModalityLimits {
  name: string;
  isTeamSport: boolean;
  type: "individual" | "coletivo";
  /** Limites por gênero. null = não disponível nesse gênero */
  masculino: number | null;
  feminino: number | null;
  /** Treinadores por gênero */
  maxCoachesPerGender: number;
  /** Notas especiais do regulamento */
  notes?: string;
}

export const JJ2026_INDIVIDUAL_MODALITIES: JJ2026ModalityLimits[] = [
  { name: "Águas Abertas", isTeamSport: false, type: "individual", masculino: 1, feminino: 1, maxCoachesPerGender: 1 },
  { name: "Atletismo", isTeamSport: false, type: "individual", masculino: 14, feminino: 14, maxCoachesPerGender: 2, notes: "14ª vaga exclusiva para Marcha Atlética. Até 18 atletas: 1 treinador; acima: 2." },
  { name: "Badminton", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1 },
  { name: "Ciclismo", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1, notes: "1ª divisão: 2/gênero; 2ª divisão: 1/gênero" },
  { name: "Esgrima Espada", isTeamSport: false, type: "individual", masculino: 1, feminino: 1, maxCoachesPerGender: 1 },
  { name: "Ginástica Artística", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1 },
  { name: "Ginástica Rítmica", isTeamSport: false, type: "individual", masculino: null, feminino: 7, maxCoachesPerGender: 1, notes: "1ª div: 7 (2 indiv + 5 conjunto); 2ª div: 2 (individuais)" },
  { name: "Judô", isTeamSport: false, type: "individual", masculino: 8, feminino: 8, maxCoachesPerGender: 1 },
  { name: "Natação", isTeamSport: false, type: "individual", masculino: 8, feminino: 8, maxCoachesPerGender: 1 },
  { name: "Remo Virtual", isTeamSport: false, type: "individual", masculino: 1, feminino: 1, maxCoachesPerGender: 1 },
  { name: "Taekwondo", isTeamSport: false, type: "individual", masculino: 5, feminino: 5, maxCoachesPerGender: 1 },
  { name: "Tênis de Mesa", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1 },
  { name: "Tiro com Arco", isTeamSport: false, type: "individual", masculino: 1, feminino: 1, maxCoachesPerGender: 1 },
  { name: "Triathlon", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1, notes: "1ª divisão: 2/gênero; 2ª divisão: 1/gênero" },
  { name: "Vôlei de Praia", isTeamSport: false, type: "individual", masculino: 2, feminino: 2, maxCoachesPerGender: 1 },
  { name: "Wrestling", isTeamSport: false, type: "individual", masculino: 8, feminino: 5, maxCoachesPerGender: 1 },
];

export const JJ2026_TEAM_MODALITIES: JJ2026ModalityLimits[] = [
  { name: "Basquetebol", isTeamSport: true, type: "coletivo", masculino: 9, feminino: 9, maxCoachesPerGender: 2 },
  { name: "Futsal", isTeamSport: true, type: "coletivo", masculino: 9, feminino: 9, maxCoachesPerGender: 2 },
  { name: "Handebol", isTeamSport: true, type: "coletivo", masculino: 12, feminino: 12, maxCoachesPerGender: 2, notes: "1ª div: 12; 2ª/3ª div: 11" },
  { name: "Voleibol", isTeamSport: true, type: "coletivo", masculino: 10, feminino: 10, maxCoachesPerGender: 2 },
];

export const JJ2026_ALL_MODALITIES = [...JJ2026_INDIVIDUAL_MODALITIES, ...JJ2026_TEAM_MODALITIES];

// ─── Composição de Delegação (Art 13-14) ───
export const JJ2026_DELEGATION_LIMITS = {
  maxTotal: 242,
  maxDirigentes: 6,
  minDirigentes: 3,
  roles: [
    { role: "Chefe de Delegação", min: 1, max: 1, required: true },
    { role: "Oficial de Delegação", min: 2, max: 3, required: true, notes: "Obrigatoriamente 1 do gênero feminino" },
    { role: "Médico/Fisioterapeuta", min: 1, max: 2, required: true, notes: "Se 3 oficiais: máx 1; se 2 oficiais: máx 2" },
    { role: "Jornalista", min: 1, max: 1, required: true },
  ],
};

// ─── Regras de inscrição (Art 33, 38) ───
export const JJ2026_INSCRIPTION_RULES = {
  maxModalitiesPerAthlete: 2,       // Art 33.II
  maxSubstitutionsPerModality: 3,   // Art 38.III
  maxDirigenteSubstitutions: 2,     // Art 38.IV
};

// ─── Datas importantes (Art 36) ───
export const JJ2026_KEY_DATES = {
  termoAdesao: "2026-03-20",
  regulamentoSeletiva: "2026-04-30",
  cadastroUF: "2026-07-17",
  inscricaoNumerica: "2026-07-17",
  inscricaoNominal: "2026-09-11",
  documentos: "2026-09-18",
  planoChegada: "2026-10-02",
  entregaDocumentos: ["2026-10-16", "2026-10-17"],
  reuniaoChefes: "2026-10-18",
  inicioJogos: "2026-10-19",
  fimJogos: "2026-11-03",
};

// ─── Categorias de faixa etária para criar no sistema ───
export interface JJ2026CategoryTemplate {
  name: string;
  yearMin: number;
  yearMax: number;
  description: string;
}

export const JJ2026_CATEGORIES: JJ2026CategoryTemplate[] = [
  { name: "15 a 17 anos (2009-2011)", yearMin: 2009, yearMax: 2011, description: "Faixa padrão JJ 2026 – Art 12" },
  { name: "14 a 16 anos (2010-2012)", yearMin: 2010, yearMax: 2012, description: "Águas Abertas, Judô, Natação, Wrestling – Art 12.I" },
  { name: "14 a 17 anos (2009-2012)", yearMin: 2009, yearMax: 2012, description: "Esgrima, GA Masc, Remo Virtual – Art 12.II" },
  { name: "13 a 15 anos (2011-2013)", yearMin: 2011, yearMax: 2013, description: "Ginástica Artística Feminina – Art 12.III" },
  { name: "14 e 15 anos (2011-2012)", yearMin: 2011, yearMax: 2012, description: "Ginástica Rítmica, Tênis de Mesa – Art 12.IV" },
];

/**
 * Retorna a faixa etária correta para uma modalidade baseado no Art 12.
 */
export function getAgeRangeForModality(modalityName: string): JJ2026AgeRange {
  // Check exceptions first (exact match or partial match)
  for (const [key, range] of Object.entries(JJ2026_AGE_EXCEPTIONS)) {
    if (modalityName.toLowerCase().includes(key.toLowerCase())) {
      return range;
    }
  }
  return JJ2026_DEFAULT_AGE;
}

/**
 * Retorna a categoria correspondente para uma modalidade.
 */
export function getCategoryForModality(modalityName: string): JJ2026CategoryTemplate {
  const age = getAgeRangeForModality(modalityName);
  return JJ2026_CATEGORIES.find(
    (c) => c.yearMin === age.birthYearMin && c.yearMax === age.birthYearMax
  ) || JJ2026_CATEGORIES[0];
}

/**
 * Gera o rules_config para uma modalidade+gênero específicos.
 */
export function generateRulesConfig(
  modalityName: string,
  gender: "M" | "F"
): Record<string, unknown> {
  const age = getAgeRangeForModality(modalityName);
  const modality = JJ2026_ALL_MODALITIES.find(
    (m) => m.name.toLowerCase() === modalityName.toLowerCase()
  );

  const maxAthletes = gender === "M"
    ? modality?.masculino ?? 0
    : modality?.feminino ?? 0;

  return {
    birth_year_min: age.birthYearMin,
    birth_year_max: age.birthYearMax,
    birth_date_min: `${age.birthYearMin}-01-01`,
    birth_date_max: `${age.birthYearMax}-12-31`,
    min_athletes: modality?.isTeamSport ? 5 : 1,
    max_athletes: maxAthletes,
    max_staff: modality?.maxCoachesPerGender ?? 1,
    max_coaches: modality?.maxCoachesPerGender ?? 1,
    requires_rg: true,
    requires_medical_cert: true,
    allow_transgender: true,
    scoring_system: modality?.isTeamSport ? "grupos_mata_mata" : "pontos_corridos",
    is_team_sport: modality?.isTeamSport ?? false,
    modality_type: modality?.type ?? "individual",
    max_modalities_per_athlete: JJ2026_INSCRIPTION_RULES.maxModalitiesPerAthlete,
    max_substitutions: JJ2026_INSCRIPTION_RULES.maxSubstitutionsPerModality,
    notes: modality?.notes || null,
    regulation_ref: "Regulamento Geral JJ 2026 – COB",
  };
}
