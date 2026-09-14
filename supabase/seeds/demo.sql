-- ============================================================================
-- Somos Preta — Dados de demonstração
--
-- OPCIONAL e descartável. Serve para ver as telas com conteúdo antes de os
-- dados reais entrarem — clientes, campanhas e tarefas dos mocks aprovados.
--
-- Tudo aqui é inventado. Os contatos usam o domínio .test, reservado por RFC
-- 6761 justamente para não existir, e os telefones são de faixa inválida: nada
-- neste arquivo alcança uma pessoa de verdade. É por isso que ele é versionado
-- enquanto supabase/seeds/criadores.sql, com dados reais, não é.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole > Run.
-- Rodar de novo NÃO duplica: tudo é chaveado por ids fixos com on conflict.
--
-- Como remover TUDO depois (a cascata leva tarefas, subtarefas e vínculos):
--   delete from somos_preta_clientes where id in (
--     '00000000-0000-4000-8000-000000000001',
--     '00000000-0000-4000-8000-000000000002'
--   );
--   delete from somos_preta_influencers where id::text like '00000000-0000-4000-8001-%';
--
-- Depende de 0019 e 0020 já aplicadas.
-- ============================================================================

-- O responsável vira o primeiro perfil de equipe que existir; sem ninguém
-- logado ainda, fica nulo e as telas mostram "Sem responsável".
do $$
declare
  v_dono uuid;
  v_solar uuid := '00000000-0000-4000-8000-000000000001';
  v_ades  uuid := '00000000-0000-4000-8000-000000000002';
  v_fanta uuid := '00000000-0000-4000-8000-000000000011';
  v_zero  uuid := '00000000-0000-4000-8000-000000000012';
  v_hallo uuid := '00000000-0000-4000-8000-000000000013';
  v_goles uuid := '00000000-0000-4000-8000-000000000014';
  v_area_op     uuid;
  v_area_midia  uuid;
  v_area_design uuid;
  v_area_plat   uuid;
  v_area_jur    uuid;
begin
  select id into v_dono from somos_preta_profiles
  where role in ('admin', 'gestor', 'analista') order by created_at limit 1;

  select id into v_area_op     from somos_preta_areas where slug = 'operacao';
  select id into v_area_midia  from somos_preta_areas where slug = 'midia';
  select id into v_area_design from somos_preta_areas where slug = 'design';
  select id into v_area_plat   from somos_preta_areas where slug = 'plataforma';
  select id into v_area_jur    from somos_preta_areas where slug = 'juridico';

  -- ---------------------------------------------------------------- clientes
  insert into somos_preta_clientes
    (id, nome, empresa, segmento, cidade, estado, site, status, responsavel_id,
     contato_nome, contato_cargo, email, telefone, observacoes)
  values
    (v_solar, 'Solar Coca-Cola', 'COCA-COLA', 'Bebidas', 'Fortaleza', 'CE',
     'https://www.solarbr.com.br', 'ativo', v_dono,
     'Juliana Costa', 'Account Manager', 'juliana@exemplo.test', '+55 85 90000-0001',
     'Maior fabricante do sistema Coca-Cola no Brasil, com atuação no Nordeste e parte do Norte do país.'),
    (v_ades, 'Ades', 'ADES', 'Bebidas', 'São Paulo', 'SP',
     'https://www.ades.com.br', 'ativo', v_dono,
     'Marcos Prado', 'Trade Marketing', 'marcos@exemplo.test', '+55 11 90000-0002',
     'Marca de bebidas vegetais; foco em ocasiões de consumo do dia a dia.')
  on conflict (id) do nothing;

  -- --------------------------------------------------------------- campanhas
  insert into somos_preta_campanhas
    (id, cliente_id, nome, tagline, objetivo, status, etapa, responsavel, prioridade,
     orcamento_estimado, orcamento_aprovado, orcamento_final, data_inicio, data_fim)
  values
    (v_fanta, v_solar, 'FANTA UVA ZERO AÇÚCAR', 'Refresca novas histórias.',
     'Apresentar a versão zero açúcar para o público jovem do Nordeste.',
     'planejamento', 'mapeamento', v_dono, 'alta',
     299880.00, 299880.00, null, current_date - 20, current_date + 26),

    (v_zero, v_solar, 'COCA-COLA ZERO ZERO', 'Todo momento pede um zero.',
     'Reforçar consumo em ocasiões cotidianas com creators regionais.',
     'ativa', 'aprovacao', v_dono, 'urgente',
     450000.00, 450000.00, null, current_date - 45, current_date + 51),

    (v_hallo, v_solar, 'FANTA HALLOWEEN', 'Mais sustos. Mais Fanta.',
     'Campanha sazonal de Halloween com foco em conteúdo de criador.',
     'em_aprovacao', 'aprovacao', v_dono, 'media',
     380000.00, null, null, current_date - 10, current_date + 67),

    (v_goles, v_ades, 'ADES | GOLES DA IMAGINAÇÃO', 'Imaginação também nutre.',
     'Série de conteúdos sobre alimentação e criatividade na infância.',
     'concluida', 'relatorio', v_dono, 'baixa',
     220000.00, 220000.00, 220000.00, current_date - 120, current_date - 45)
  on conflict (id) do nothing;

  -- Uma campanha que já estava aguardando aprovação há mais de 7 dias, para o
  -- card "1 há mais de 7 dias" ter o que mostrar. O trigger de status_desde só
  -- carimba quando o status muda, então aqui o valor é escrito direto.
  update somos_preta_campanhas
  set status_desde = now() - interval '11 days'
  where id = v_hallo;

  -- ----------------------------------------------------------------- tarefas
  insert into somos_preta_tarefas
    (id, campanha_id, titulo, descricao, status, prioridade, area_id, responsavel,
     data_entrega, horario, duracao_minutos, tags)
  values
    ('00000000-0000-4000-8002-000000000001', v_fanta, 'QA — Validação da página de creators',
     'Conferir responsivo e formulário antes de subir.', 'em_andamento', 'media', v_area_plat, v_dono,
     current_date, '17:00', 60, array['Plataforma','QA']),

    ('00000000-0000-4000-8002-000000000002', v_fanta, 'Briefing de mídia OOH',
     'Fechar praças e formatos com a agência de mídia.', 'a_fazer', 'urgente', v_area_midia, v_dono,
     current_date - 3, '10:00', 90, array['Mídia','OOH']),

    ('00000000-0000-4000-8002-000000000003', v_zero, 'Mapeamento de creators Fortaleza',
     'Levantar 30 perfis locais com engajamento acima de 4%.', 'em_andamento', 'alta', v_area_op, v_dono,
     current_date + 5, '10:00', 120, array['Creators','Mapeamento']),

    ('00000000-0000-4000-8002-000000000004', v_zero, 'Layout da landing page',
     'Primeira versão para revisão interna.', 'em_revisao', 'media', v_area_design, v_dono,
     current_date + 2, '11:00', 60, array['Design','Plataforma']),

    ('00000000-0000-4000-8002-000000000005', v_hallo, 'Organizar banco de creators Nordeste',
     'Consolidar as listas por estado.', 'backlog', 'media', v_area_op, v_dono,
     current_date + 8, '13:00', 90, array['Operação','Creators']),

    ('00000000-0000-4000-8002-000000000006', v_hallo, 'Revisar contrato Clicksign',
     'Ajustar cláusula de uso de imagem.', 'a_fazer', 'alta', v_area_jur, v_dono,
     current_date + 4, '09:00', 60, array['Jurídico','Contrato']),

    ('00000000-0000-4000-8002-000000000007', v_fanta, 'Ajustes no dashboard',
     'Aplicar retorno do time de dados.', 'concluida', 'baixa', v_area_plat, v_dono,
     current_date - 6, '15:00', 60, array['Plataforma','Front-end']),

    ('00000000-0000-4000-8002-000000000008', v_goles, 'Enviar presskit para creators',
     'Disparo com material e orientações.', 'aguardando_terceiro', 'media', v_area_op, v_dono,
     current_date + 3, '16:00', 45, array['Creators','Presskit'])
  on conflict (id) do nothing;

  update somos_preta_tarefas
  set concluida_em = now() - interval '2 days'
  where id = '00000000-0000-4000-8002-000000000007' and concluida_em is null;

  -- --------------------------------------------------------------- subtarefas
  -- somos_preta_subtarefas não tem restrição única, então `on conflict` não
  -- teria em que morder: rodar o seed duas vezes duplicaria a lista. A guarda
  -- é explícita — só insere para tarefa que ainda não tem subtarefa nenhuma.
  insert into somos_preta_subtarefas (tarefa_id, titulo, concluida, ordem)
  select v.tarefa_id::uuid, v.titulo, v.concluida, v.ordem
  from (values
    ('00000000-0000-4000-8002-000000000001', 'Conferir no mobile',  true,  1),
    ('00000000-0000-4000-8002-000000000001', 'Conferir formulário', false, 2),
    ('00000000-0000-4000-8002-000000000003', 'Levantar Fortaleza',  true,  1),
    ('00000000-0000-4000-8002-000000000003', 'Levantar Recife',     true,  2),
    ('00000000-0000-4000-8002-000000000003', 'Levantar Salvador',   false, 3),
    ('00000000-0000-4000-8002-000000000004', 'Wireframe',           true,  1),
    ('00000000-0000-4000-8002-000000000004', 'Layout final',        true,  2),
    ('00000000-0000-4000-8002-000000000004', 'Revisão do cliente',  false, 3)
  ) as v(tarefa_id, titulo, concluida, ordem)
  where not exists (
    select 1 from somos_preta_subtarefas s where s.tarefa_id = v.tarefa_id::uuid
  );

  -- ------------------------------------------------- creators nas campanhas
  -- Usa quem já existe na base (o seed de criadores popula a tabela) para as
  -- métricas "mapeados / aprovados" do card terem número de verdade.
  insert into somos_preta_campanha_influencers (campanha_id, influencer_id, etapa)
  select v_zero, id,
    (array['mapeado','em_analise','aprovado_preta','contratado'])[1 + (row_number() over (order by id)) % 4]::somos_preta_pipeline_etapa
  from somos_preta_influencers
  order by id
  limit 32
  on conflict do nothing;

  insert into somos_preta_campanha_influencers (campanha_id, influencer_id, etapa)
  select v_fanta, id,
    (array['mapeado','mapeado','aprovado_preta'])[1 + (row_number() over (order by id desc)) % 3]::somos_preta_pipeline_etapa
  from somos_preta_influencers
  order by id desc
  limit 18
  on conflict do nothing;
end $$;

-- ============================================================================
-- FIM
-- ============================================================================
