-- ============================================
-- SISTEMA DE BARBEARIA - BANCO DE DADOS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USUARIOS (Titulares)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPENDENTES
CREATE TABLE dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_titular_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  tipo VARCHAR(50) DEFAULT 'filho',
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BARBEIROS
CREATE TABLE barbeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  tipo_acesso VARCHAR(50) DEFAULT 'barbeiro' CHECK (tipo_acesso IN ('barbeiro', 'admin', 'dono')),
  limite_vale DECIMAL(10,2) DEFAULT 500,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BARBEIRO_HORARIOS
CREATE TABLE barbeiro_horarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT true
);

-- 5. BARBEIRO_NOTURNO (horario especial 19-21)
CREATE TABLE noturno_ativado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(barbeiro_id, data)
);

-- 6. SERVICOS
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true
);

-- 7. BARBEIRO_ESPECIALIDADES
CREATE TABLE barbeiro_especialidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  preco_customizado DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  UNIQUE(barbeiro_id, servico_id)
);

-- 8. AGENDAMENTOS
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_titular_id UUID NOT NULL REFERENCES usuarios(id),
  dependente_id UUID REFERENCES dependentes(id),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id),
  servico_id UUID NOT NULL REFERENCES servicos(id),
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco_servico DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_atendimento', 'concluido', 'cancelado')),
  motivo_cancelamento TEXT,
  observacoes TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. COMANDA
CREATE TABLE comandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agendamento_id UUID REFERENCES agendamentos(id),
  cliente_nome VARCHAR(255) NOT NULL,
  titular_nome VARCHAR(255),
  total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_fechamento TIMESTAMP,
  forma_pagamento VARCHAR(50)
);

-- 10. ITENS_COMANDA
CREATE TABLE itens_comanda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) CHECK (tipo IN ('servico', 'produto')),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  quantidade INTEGER DEFAULT 1,
  data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. PRODUTOS
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  estoque INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true
);

-- 12. COMISSOES
CREATE TABLE comissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id),
  comanda_id UUID REFERENCES comandas(id),
  valor_servico DECIMAL(10,2) NOT NULL,
  percentual_comissao INTEGER DEFAULT 50,
  valor_comissao DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
  semana_inicio DATE,
  semana_fim DATE,
  data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_pagamento TIMESTAMP
);

-- 13. VALES
CREATE TABLE vales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id),
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'aberto' CHECK (status IN ('aberto', 'descontado', 'cancelado')),
  observacoes TEXT,
  data_vale TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_desconto TIMESTAMP
);

-- 14. ACERTOS_COMISSAO
CREATE TABLE acertos_comissao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id),
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  UNIQUE(barbeiro_id, semana_inicio, semana_fim),
  valor_total_comissao DECIMAL(10,2) NOT NULL,
  total_vales_descontados DECIMAL(10,2) DEFAULT 0,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago_parcial', 'pago_completo')),
  responsavel_pagamento_id UUID,
  data_pagamento TIMESTAMP,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. MOVIMENTACOES_FINANCEIRAS
CREATE TABLE movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) CHECK (tipo IN ('entrada', 'saida')),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'outro',
  comanda_id UUID REFERENCES comandas(id),
  barbeiro_id UUID REFERENCES barbeiros(id),
  data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. BLOQUEIOS_HORARIO
CREATE TABLE bloqueios_barbeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  hora_inicio TIME,
  data_fim DATE NOT NULL,
  hora_fim TIME,
  motivo VARCHAR(255) NOT NULL
);

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX idx_agendamentos_barbeiro ON agendamentos(barbeiro_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_comandas_status ON comandas(status);
CREATE INDEX idx_comissoes_barbeiro ON comissoes(barbeiro_id);
CREATE INDEX idx_comissoes_periodo ON comissoes(semana_inicio);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimento);
CREATE INDEX idx_acertos_barbeiro ON acertos_comissao(barbeiro_id);

-- ============================================
-- VIEWS UTEIS
-- ============================================
CREATE VIEW vw_comissoes_pendentes AS
SELECT b.nome AS barbeiro, SUM(c.valor_comissao) AS total_pendente
FROM comissoes c JOIN barbeiros b ON b.id = c.barbeiro_id
WHERE c.status = 'pendente'
GROUP BY b.nome;

CREATE VIEW vw_faturamento_diario AS
SELECT DATE(data_movimento) AS data, SUM(valor) AS total
FROM movimentacoes WHERE tipo = 'entrada'
GROUP BY DATE(data_movimento)
ORDER BY data DESC;

CREATE VIEW vw_agenda_dia AS
SELECT a.data, a.hora_inicio, a.hora_fim, b.nome AS barbeiro,
       u.nome AS titular, d.nome AS dependente, s.nome AS servico, a.status
FROM agendamentos a
JOIN barbeiros b ON b.id = a.barbeiro_id
JOIN servicos s ON s.id = a.servico_id
LEFT JOIN usuarios u ON u.id = a.usuario_titular_id
LEFT JOIN dependentes d ON d.id = a.dependente_id
ORDER BY a.data, a.hora_inicio;

-- ============================================
-- DADOS INICIAIS
-- ============================================
INSERT INTO servicos (nome, duracao_minutos, preco) VALUES
('Corte Masculino', 30, 45.00),
('Barba', 30, 35.00),
('Corte + Barba', 60, 90.00),
('Sobrancelha', 20, 20.00),
('Design', 45, 50.00),
('Hidratação', 40, 40.00);
