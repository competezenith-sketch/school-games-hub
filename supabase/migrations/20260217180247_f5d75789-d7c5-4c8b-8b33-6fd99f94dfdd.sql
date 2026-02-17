
-- Organização de teste
INSERT INTO organizations (id, name, slug, state) 
VALUES ('a0000000-0000-0000-0000-000000000001', 'JER Goiás', 'jer-go', 'GO');

-- Competição de teste
INSERT INTO competitions (id, org_id, name, year, status, start_date, end_date) 
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'JER 2026', 2026, 'em_andamento', '2026-02-15', '2026-02-22');

-- Delegações de teste
INSERT INTO delegations (id, org_id, name, city, type) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Goiânia', 'Goiânia', 'municipio'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Anápolis', 'Anápolis', 'municipio'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Aparecida de Goiânia', 'Aparecida de Goiânia', 'municipio'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Rio Verde', 'Rio Verde', 'municipio');

-- Jogos de teste (hoje e outros dias)
INSERT INTO matches (id, org_id, competition_id, delegation_a_id, delegation_b_id, match_date, match_time, location, status, match_number) VALUES
-- Jogos de hoje
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00', 'Ginásio Municipal', 'agendado', 1),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', CURRENT_DATE, '14:00', 'Quadra Poliesportiva', 'em_andamento', 2),
-- Jogos passados (encerrado)
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', '10:00', 'Ginásio Municipal', 'encerrado', 3),
-- Jogos futuros
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '1 day', '16:00', 'Estádio Serra Dourada', 'agendado', 4);

-- Placar do jogo encerrado
UPDATE matches SET score_a = 3, score_b = 1, winner_delegation_id = 'c0000000-0000-0000-0000-000000000001' WHERE id = 'd0000000-0000-0000-0000-000000000003';
