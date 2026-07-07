-- 0007_foreign_keys.sql
-- Todas as foreign keys (apos criacao de todas as tabelas)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_avaliador_id_fkey FOREIGN KEY (avaliador_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_cargos add constraint concremrh_cargos_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_local_dss_id_fkey FOREIGN KEY (local_dss_id) REFERENCES concremrh_locais_dss(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_epi add constraint concremrh_epi_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_superior_id_fkey FOREIGN KEY (cargo_superior_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_faixas add constraint concremrh_faixas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_aplicado_por_fkey FOREIGN KEY (aplicado_por) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES concremrh_empresas(id) ON DELETE CASCADE;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_faixa_id_fkey FOREIGN KEY (faixa_id) REFERENCES concremrh_faixas(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES concremrh_funcoes(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_local_dss_id_fkey FOREIGN KEY (local_dss_id) REFERENCES concremrh_locais_dss(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE CASCADE;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_cargo_anterior_id_fkey FOREIGN KEY (cargo_anterior_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_indicadores_gerais add constraint concremrh_indicadores_gerais_tipo_indicador_id_fkey FOREIGN KEY (tipo_indicador_id) REFERENCES concremrh_tipos_indicadores_gerais(id) ON DELETE RESTRICT;
alter table public.concremrh_indicadores_setor add constraint concremrh_indicadores_setor_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_destino_id_fkey FOREIGN KEY (cargo_destino_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_origem_id_fkey FOREIGN KEY (cargo_origem_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_producao_setor add constraint concremrh_producao_setor_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE CASCADE;
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_setores add constraint concremrh_setores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES concremrh_empresas(id) ON DELETE CASCADE;
alter table public.concremrh_setores add constraint concremrh_setores_encarregado_id_fkey FOREIGN KEY (encarregado_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_setores add constraint concremrh_setores_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissions_application_id_fkey FOREIGN KEY (application_id) REFERENCES concremrh_hr_applications(id) ON DELETE CASCADE;
