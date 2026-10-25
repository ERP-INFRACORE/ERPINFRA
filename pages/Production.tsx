import React, { useState, useMemo, useEffect } from 'react';
import {
    Factory,
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    Play,
    Pause,
    Plus,
    Filter,
    X,
    Save,
    Thermometer,
    Zap,
    Circle,
    Beaker,
    User,
    Layers,
    Archive,
    FlaskConical,
    Trash2,
    Check,
    Edit2,
    Settings,
    Clock,
    Printer,
    Download,
    Search,
    Copy,
    FileText,
    ShieldCheck,
    Award,
    Activity,
    FileCheck,
    Eye,
    Info,
    Sliders,
    Percent,
    Mountain
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ProductionOrder, InventoryItem, ProductionFormula, QualityTest, ProductionUnit } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportToCSV, printDocument } from '../utils/exportUtils';

export interface StockShortageItem {
    productId: string;
    ingredientName: string;
    requiredQty: number;
    availableQty: number;
    shortageQty: number;
    unit: string;
}

export interface StockShortageCheckResult {
    hasShortage: boolean;
    shortages: StockShortageItem[];
    message: string;
}

let currentFormulasRef: ProductionFormula[] = [];
let currentInventoryRef: InventoryItem[] = [];

/**
 * Função auxiliar que multiplica a quantidade planejada da O.P. pelos ingredientes
 * da ProductionFormula e identifica qualquer insumo em inventory com saldo insuficiente.
 */
export const checkFormulaStockShortage = (
    order: { formulaId?: string; quantity?: number } | ProductionOrder,
    formulasList: ProductionFormula[] = currentFormulasRef,
    inventoryList: InventoryItem[] = currentInventoryRef
): StockShortageCheckResult => {
    const formula = formulasList.find(f => f.id === order.formulaId);
    const plannedQuantity = order.quantity || 0;

    if (!formula || !formula.ingredients || formula.ingredients.length === 0) {
        return {
            hasShortage: false,
            shortages: [],
            message: 'Nenhum ingrediente configurado na fórmula.'
        };
    }

    const shortages: StockShortageItem[] = [];

    formula.ingredients.forEach(ing => {
        const requiredQty = Number(((ing.qty || 0) * plannedQuantity).toFixed(3));

        // Busca o item no estoque pelo ID do produto ou fallback por nome
        const stockItem = inventoryList.find(i => i.id === ing.productId)
            || inventoryList.find(i => ing.name && i.name.toLowerCase().trim() === ing.name.toLowerCase().trim());

        const availableQty = stockItem ? stockItem.quantity : 0;
        const unit = ing.unit || stockItem?.unit || 'un';
        const ingredientName = ing.name || stockItem?.name || 'Insumo não identificado';

        if (availableQty < requiredQty) {
            shortages.push({
                productId: ing.productId || stockItem?.id || '',
                ingredientName,
                requiredQty,
                availableQty,
                shortageQty: Number((requiredQty - availableQty).toFixed(3)),
                unit
            });
        }
    });

    const hasShortage = shortages.length > 0;
    const message = hasShortage
        ? `Saldo insuficiente no estoque para: ${shortages.map(s => `${s.ingredientName} (Necessário: ${s.requiredQty} ${s.unit}, Disponível: ${s.availableQty} ${s.unit})`).join('; ')}`
        : 'Estoque suficiente para todos os insumos da fórmula.';

    return {
        hasShortage,
        shortages,
        message
    };
};

/* =========================================================================
   MÓDULO DE CONTROLE TECNOLÓGICO, USINAS E LABORATÓRIO NORMATIVO DNIT
   Engenharia de Pavimentação, Agregados e Estruturas
   ========================================================================= */

export type LabModuleType = 'solos' | 'agregados' | 'asfalto' | 'concreto';

export interface DNITStandardDef {
    id: string;
    code: string;
    module: LabModuleType;
    name: string;
    norm: string;
    description: string;
    sampleType: string;
    defaultUnit: string;
    nominalExpected: string;
    benchFields: { key: string; label: string; unit: string; placeholder: string; defaultValue?: number | string }[];
}

export interface DNITLabTest {
    id: string;
    module: LabModuleType;
    category?: string;
    testCode: string;
    testName: string;
    standardNorm: string;
    sampleType: string;
    batchNumber: string;
    orderId?: string;
    orderNumber?: string;
    productName: string;
    unitId?: string;
    unitName?: string;
    locationOrStation?: string; // ex: "Rodovia BR-116, Km 214+400, Pista Sul"
    supplierOrQuarry?: string; // ex: "Pedreira Basalto Central / Refinaria REVAP"
    testedAt: string;
    tester: string;
    supervisor: string; // Eng. Responsável / CREA
    nominalExpected: string;
    resultValue: string;
    status: 'Aprovado' | 'Reprovado' | 'Ressalva';
    conditionalRelease?: boolean;
    notes?: string;
    benchData?: Record<string, any>;
    metricsCalculated?: Record<string, any>;
}

export const DNIT_TEST_CATALOG: DNITStandardDef[] = [
    // -------------------------------------------------------------------------
    // 0. MÓDULO SOLOS & GEOTECNIA RODOVIÁRIA (DNIT / DNER)
    // -------------------------------------------------------------------------
    {
        id: 'sol-proctor',
        code: 'DNIT-164-PROCTOR',
        module: 'solos',
        name: 'Compactação de Solos (Ensaio Proctor)',
        norm: 'DNIT 164/2013-ME / DNER-ME 162',
        description: 'Determinação da curva de compactação, Massa Específica Aparente Seca Máxima (γd,max) e Umidade Ótima (wot).',
        sampleType: 'Solo de Jazida / Corte / Camada de Terraplenagem',
        defaultUnit: 'g/cm³ / %',
        nominalExpected: 'Energia Intermediária/Modificada conforme especificação de projeto',
        benchFields: [
            { key: 'energia_compactacao', label: 'Energia Utilizada', unit: 'tipo', placeholder: 'Ex: Proctor Intermediária' },
            { key: 'massa_especifica_seca_max', label: 'Massa Específica Seca Máx (γd,max)', unit: 'g/cm³', placeholder: 'Ex: 1.845' },
            { key: 'umidade_otima_percent', label: 'Umidade Ótima (wot)', unit: '%', placeholder: 'Ex: 13.8' }
        ]
    },
    {
        id: 'sol-cbr',
        code: 'DNIT-172-CBR',
        module: 'solos',
        name: 'Índice de Suporte Califórnia (CBR / ISC) e Expansão',
        norm: 'DNIT 172/2016-ME / DNER-ME 049',
        description: 'Capacidade de suporte mecânico e potencial de expansão volumétrica de solo compactado após 96h de imersão.',
        sampleType: 'Corpos de Prova Cilíndricos em Molde CBR',
        defaultUnit: '% CBR / % Exp',
        nominalExpected: 'Conforme especificado pelo projeto geométrico/estrutural',
        benchFields: [
            { key: 'cbr_calculado_percent', label: 'Índice CBR / ISC Obtido', unit: '%', placeholder: 'Ex: 14.5' },
            { key: 'cbr_minimo_projeto', label: 'CBR Mínimo de Projeto', unit: '%', placeholder: 'Ex: 12.0' },
            { key: 'expansao_percent', label: 'Expansão Medida no Defletômetro', unit: '%', placeholder: 'Ex: 0.4' },
            { key: 'expansao_maxima_tolerada', label: 'Expansão Máxima Tolerada', unit: '%', placeholder: 'Ex: 1.0' }
        ]
    },
    {
        id: 'sol-atterberg',
        code: 'DNER-122-ATTERBERG',
        module: 'solos',
        name: 'Limites de Consistência de Atterberg (LL, LP e IP)',
        norm: 'DNER-ME 122/94 / DNER-ME 082/94',
        description: 'Determinação do Limite de Liquidez (LL Casagrande), Limite de Plasticidade (LP) e Índice de Plasticidade (IP = LL - LP).',
        sampleType: 'Fração de Solo que passa na peneira Nº 40 (0,42 mm)',
        defaultUnit: '%',
        nominalExpected: 'Conforme parâmetros de projeto e especificação geotécnica',
        benchFields: [
            { key: 'limite_liquidez_ll', label: 'Limite de Liquidez (LL)', unit: '%', placeholder: 'Ex: 28.5' },
            { key: 'limite_plasticidade_lp', label: 'Limite de Plasticidade (LP)', unit: '%', placeholder: 'Ex: 19.2' },
            { key: 'ip_maximo_tolerado', label: 'IP Máximo de Projeto', unit: '%', placeholder: 'Ex: 12.0' }
        ]
    },
    {
        id: 'sol-gran-conjunta',
        code: 'DNER-051-GRAN-SOLO',
        module: 'solos',
        name: 'Granulometria Conjunta (Peneiramento + Sedimentação)',
        norm: 'DNER-ME 051/94 / NBR 7181',
        description: 'Distribuição granulométrica completa do solo por peneiramento mecânico e densímetro/sedimentação para silte e argila.',
        sampleType: 'Solo Integral de Jazida ou Pista',
        defaultUnit: '% passante',
        nominalExpected: 'Frações texturais de projeto (Pedregulho, Areia, Silte e Argila)',
        benchFields: [
            { key: 'perc_pedregulho', label: 'Fração Pedregulho (> 2,0 mm)', unit: '%', placeholder: 'Ex: 12.4' },
            { key: 'perc_areia', label: 'Fração Areia (0,075 a 2,0 mm)', unit: '%', placeholder: 'Ex: 51.6' },
            { key: 'perc_silte', label: 'Fração Silte (0,002 a 0,075 mm)', unit: '%', placeholder: 'Ex: 21.0' },
            { key: 'perc_argila', label: 'Fração Argila (< 0,002 mm)', unit: '%', placeholder: 'Ex: 15.0' }
        ]
    },
    {
        id: 'sol-frasco-areia',
        code: 'DNER-092-FRASCO-AREIA',
        module: 'solos',
        name: 'Massa Específica In Situ e Grau de Compactação (Frasco de Areia)',
        norm: 'DNER-ME 092/94 / NBR 7185',
        description: 'Determinação in situ da massa específica aparente seca (γd) e verificação do Grau de Compactação (GC) em pista.',
        sampleType: 'Camada de Solo Compactada na Pista de Terraplenagem',
        defaultUnit: '% GC',
        nominalExpected: 'GC ≥ 95% (Corpo Aterro) / GC ≥ 100% (Subleito/Sub-base)',
        benchFields: [
            { key: 'massa_solo_umido_g', label: 'Massa de Solo Úmido Retirado do Furo', unit: 'g', placeholder: 'Ex: 3450.0' },
            { key: 'massa_areia_utilizada_g', label: 'Massa de Areia Padrão Gasta no Furo', unit: 'g', placeholder: 'Ex: 2420.0' },
            { key: 'densidade_areia_padrao', label: 'Massa Específica da Areia Calibrada', unit: 'g/cm³', placeholder: 'Ex: 1.420' },
            { key: 'umidade_campo_percent', label: 'Umidade do Solo In Situ (w)', unit: '%', placeholder: 'Ex: 13.5' },
            { key: 'densidade_seca_max_proctor', label: 'γd,max do Ensaio Proctor de Referência', unit: 'g/cm³', placeholder: 'Ex: 1.840' },
            { key: 'gc_minimo_exigido', label: 'Grau de Compactação Mínimo Exigido', unit: '%', placeholder: 'Ex: 100.0' }
        ]
    },
    {
        id: 'sol-speedy',
        code: 'DNER-052-SPEEDY',
        module: 'solos',
        name: 'Teor de Umidade Rápida In Situ (Speedy Moisture)',
        norm: 'DNER-ME 052/94',
        description: 'Determinação expedita em campo da umidade do solo por reação com carbeto de cálcio e pressão de gás acetileno.',
        sampleType: 'Solo Coletado Diretamente no Pátio / Pista de Rolamento',
        defaultUnit: '% umidade',
        nominalExpected: 'Desvio admissível em relação à umidade ótima wot ± 2,0%',
        benchFields: [
            { key: 'umidade_speedy_medida', label: 'Leitura de Umidade no Manômetro Speedy', unit: '%', placeholder: 'Ex: 13.2' },
            { key: 'umidade_otima_proctor', label: 'Umidade Ótima Proctor de Referência (wot)', unit: '%', placeholder: 'Ex: 13.8' },
            { key: 'tolerancia_desvio_umidade', label: 'Tolerância Máxima de Desvio (±%)', unit: '± %', placeholder: 'Ex: 2.0' }
        ]
    },
    {
        id: 'sol-hrb',
        code: 'DNER-PRO-264-HRB',
        module: 'solos',
        name: 'Classificação Geotécnica Rodoviária HRB / AASHTO',
        norm: 'DNER-PRO 264/94',
        description: 'Enquadramento do solo nos grupos A-1 a A-7 e cálculo do Índice de Grupo (IG) para aptidão ao subleito.',
        sampleType: 'Solo Caracterizado de Jazida / Corte',
        defaultUnit: 'Grupo (IG)',
        nominalExpected: 'Aptidão geotécnica conforme classe de tráfego',
        benchFields: [
            { key: 'passante_peneira_n10', label: 'Passante Peneira Nº 10 (2,0 mm)', unit: '%', placeholder: 'Ex: 85.0' },
            { key: 'passante_peneira_n40', label: 'Passante Peneira Nº 40 (0,42 mm)', unit: '%', placeholder: 'Ex: 62.0' },
            { key: 'passante_peneira_n200', label: 'Passante Peneira Nº 200 (0,075 mm)', unit: '%', placeholder: 'Ex: 34.0' },
            { key: 'limite_liquidez_val', label: 'Limite de Liquidez (LL)', unit: '%', placeholder: 'Ex: 28.0' },
            { key: 'indice_plasticidade_val', label: 'Índice de Plasticidade (IP)', unit: '%', placeholder: 'Ex: 8.0' },
            { key: 'classificacao_hrb_declarada', label: 'Grupo HRB Declarado / Estimado', unit: 'classe', placeholder: 'Ex: A-2-4 (0)' }
        ]
    },
    {
        id: 'sol-dens-graos',
        code: 'DNER-093-DENS-GRAOS',
        module: 'solos',
        name: 'Massa Específica dos Grãos de Solo',
        norm: 'DNER-ME 093/94 / NBR 6458',
        description: 'Determinação da massa específica real dos grãos minerais por picnometria com água destilada a 20°C.',
        sampleType: 'Fração de Solo Passante na Peneira Nº 4 (4,75 mm)',
        defaultUnit: 'g/cm³',
        nominalExpected: 'Faixa usual de solos: 2,60 a 2,80 g/cm³',
        benchFields: [
            { key: 'massa_picnometro_cheio_agua', label: 'Massa Picnômetro + Água (M1)', unit: 'g', placeholder: 'Ex: 652.4' },
            { key: 'massa_picnometro_solo_agua', label: 'Massa Picnômetro + Solo + Água (M2)', unit: 'g', placeholder: 'Ex: 683.8' },
            { key: 'massa_solo_seco_estufa', label: 'Massa de Solo Seco (Ms)', unit: 'g', placeholder: 'Ex: 50.0' }
        ]
    },
    {
        id: 'sol-mct',
        code: 'DNIT-258-MCT',
        module: 'solos',
        name: 'Classificação MCT (Solos Tropicais / Mini-MCV)',
        norm: 'DNIT 258/2021-ME / DNER-ME 258',
        description: 'Metodologia MCT (Miniatura, Compactado, Tropical): Coeficiente c\' e Perda de Massa por Imersão (Pi) para solos lateríticos.',
        sampleType: 'Solo Tropical de Jazida Rodoviária',
        defaultUnit: 'Classe MCT',
        nominalExpected: 'Solos Lateríticos (LA, LA\', LG\') com boa capacidade portante e baixa expansão',
        benchFields: [
            { key: 'coeficiente_c_linha', label: 'Coeficiente de Deformabilidade (c\')', unit: 'adim.', placeholder: 'Ex: 1.45' },
            { key: 'perda_massa_imersao_pi', label: 'Perda de Massa por Imersão (Pi)', unit: '%', placeholder: 'Ex: 28.0' },
            { key: 'classe_mct_obtida', label: 'Classe MCT Obtida', unit: 'grupo', placeholder: 'Ex: LA\' (Areia Laterítica / Solo Laterítico Argiloso)' }
        ]
    },

    // -------------------------------------------------------------------------
    // 1. MÓDULO AGREGADOS & INSUMOS (DNIT / DNER)
    // -------------------------------------------------------------------------
    {
        id: 'ag-ea',
        code: 'DNIT-078-EA',
        module: 'agregados',
        name: 'Equivalente de Areia (EA)',
        norm: 'DNIT 078/2006-ME',
        description: 'Determinação da proporção volumétrica de poeiras/argilas no agregado miúdo.',
        sampleType: 'Agregado Miúdo / Pó de Pedra / Areia Lavada',
        defaultUnit: '%',
        nominalExpected: 'EA ≥ 55% (CBUQ DNIT 031/2006-ES)',
        benchFields: [
            { key: 'h1_areia', label: 'Leitura Nível Areia (h1)', unit: 'cm', placeholder: 'Ex: 6.8' },
            { key: 'h2_argila', label: 'Leitura Nível Argila/Floculação (h2)', unit: 'cm', placeholder: 'Ex: 10.2' },
            { key: 'temperatura_solucao', label: 'Temp. Solução de Trabalho', unit: '°C', placeholder: 'Ex: 22' }
        ]
    },
    {
        id: 'ag-la',
        code: 'DNER-035-LA',
        module: 'agregados',
        name: 'Abrasão Los Angeles',
        norm: 'DNER-ME 035/98 / DNIT 031-ES',
        description: 'Resistência ao desgaste por impacto e atrito em tambor rotativo com esferas.',
        sampleType: 'Agregado Graúdo (Brita 0, 1, 2, Bica Corrida)',
        defaultUnit: '% perda',
        nominalExpected: 'Desgaste ≤ 40% (CBUQ) / ≤ 50% (Base Graduada)',
        benchFields: [
            { key: 'm1_inicial', label: 'Massa Seca Inicial (M1)', unit: 'g', placeholder: 'Ex: 5000' },
            { key: 'm2_retida12', label: 'Massa Retida Peneira Nº 12 (M2)', unit: 'g', placeholder: 'Ex: 3620' },
            { key: 'graduacao', label: 'Graduação do Ensaio', unit: 'tipo', placeholder: 'Ex: B (11 esferas)' }
        ]
    },
    {
        id: 'ag-forma',
        code: 'DNIT-095-FORMA',
        module: 'agregados',
        name: 'Índice de Forma e Lamelaridade',
        norm: 'DNIT 095/2006-ME',
        description: 'Determinação geométrica da cuboidicidade e teor de lamelas do agregado graúdo britado.',
        sampleType: 'Agregado Graúdo Britado',
        defaultUnit: 'Índice',
        nominalExpected: 'Índice Médio ≥ 0,50 | Lamelas ≤ 15%',
        benchFields: [
            { key: 'comprimento_medio', label: 'Comprimento Maior Médio (C)', unit: 'mm', placeholder: 'Ex: 24.5' },
            { key: 'espessura_media', label: 'Espessura Menor Média (E)', unit: 'mm', placeholder: 'Ex: 13.8' },
            { key: 'perc_lamelas', label: 'Teor de Lamelas em Peneira de Fendas', unit: '%', placeholder: 'Ex: 9.4' }
        ]
    },
    {
        id: 'ag-adesividade',
        code: 'DNER-078-ADESIV',
        module: 'agregados',
        name: 'Adesividade ao Ligante Asfáltico',
        norm: 'DNER-ME 078/94',
        description: 'Avaliação estática do descolamento da película de betume sob água destilada a 40°C por 72h.',
        sampleType: 'Brita 1 / Brita 2 recoberta com CAP',
        defaultUnit: 'Parecer',
        nominalExpected: 'Satisfatório (Sem deslocamento da película)',
        benchFields: [
            { key: 'tempo_imersao', label: 'Tempo de Banho-Maria', unit: 'horas', placeholder: 'Ex: 72' },
            { key: 'temperatura_banho', label: 'Temperatura do Ensaio', unit: '°C', placeholder: 'Ex: 40' },
            { key: 'dop_utilizado', label: 'Melhorador de Adesividade (DOP)', unit: '%', placeholder: 'Ex: 0.1% ou Nenhum' }
        ]
    },
    {
        id: 'ag-granulo',
        code: 'DNER-083-GRAN',
        module: 'agregados',
        name: 'Granulometria e Módulo de Finura',
        norm: 'DNER-ME 083/98 / NBR NM 248',
        description: 'Peneiramento mecânico para caracterização da Dimensão Máxima (DMC) e Módulo de Finura (MF).',
        sampleType: 'Agregado Graúdo / Agregado Miúdo',
        defaultUnit: 'DMC / MF',
        nominalExpected: 'Enquadramento contínuo na graduação de projeto',
        benchFields: [
            { key: 'dmc_mm', label: 'Dimensão Máxima Característica (DMC)', unit: 'mm', placeholder: 'Ex: 19.0' },
            { key: 'modulo_finura', label: 'Módulo de Finura Calculado (MF)', unit: 'adim.', placeholder: 'Ex: 2.75' },
            { key: 'massa_fina_passante200', label: 'Finos Passantes Peneira Nº 200', unit: '%', placeholder: 'Ex: 1.8' }
        ]
    },
    {
        id: 'ag-dens-miudo',
        code: 'DNIT-413-DENS-MIUDO',
        module: 'agregados',
        name: 'Massa Específica e Absorção de Agregado Miúdo',
        norm: 'DNIT 413/2019-ME / DNER-ME 084/95',
        description: 'Determinação da massa específica real, aparente e percentual de absorção de água em frasco Chapman / picnômetro.',
        sampleType: 'Areia Lavada / Pó de Pedra Britado',
        defaultUnit: 'g/cm³ / %',
        nominalExpected: 'Absorção de Água ≤ 2,0% | Massa Específica: 2,55 a 2,75 g/cm³',
        benchFields: [
            { key: 'massa_seca_estufa', label: 'Massa Seca em Estufa (A)', unit: 'g', placeholder: 'Ex: 492.5' },
            { key: 'massa_sss_cone', label: 'Massa Saturada Superfície Seca (S)', unit: 'g', placeholder: 'Ex: 500.0' },
            { key: 'volume_deslocado_ml', label: 'Volume de Água Deslocado no Frasco (V)', unit: 'cm³', placeholder: 'Ex: 192.0' }
        ]
    },
    {
        id: 'ag-dens-graudo',
        code: 'DNER-081-DENS-GRAUDO',
        module: 'agregados',
        name: 'Massa Específica e Absorção de Agregado Graúdo',
        norm: 'DNER-ME 081/98 / NBR NM 53',
        description: 'Determinação por balança hidrostática da massa específica real e absorção de água da brita.',
        sampleType: 'Brita 0 / Brita 1 / Brita 2 / Rachão',
        defaultUnit: 'g/cm³ / %',
        nominalExpected: 'Absorção de Água ≤ 1,5% (CBUQ DNIT 031/2006-ES)',
        benchFields: [
            { key: 'massa_seca_estufa_g', label: 'Massa Seca em Estufa (A)', unit: 'g', placeholder: 'Ex: 3000.0' },
            { key: 'massa_sss_ar_g', label: 'Massa Saturada Superfície Seca ao Ar (B)', unit: 'g', placeholder: 'Ex: 3036.0' },
            { key: 'massa_submersa_agua_g', label: 'Massa Aparente Submersa na Água (C)', unit: 'g', placeholder: 'Ex: 1895.0' }
        ]
    },
    {
        id: 'ag-torroes',
        code: 'DNER-086-TORROES',
        module: 'agregados',
        name: 'Torrões de Argila e Partículas Friáveis',
        norm: 'DNER-ME 086/94 / NBR 7809',
        description: 'Percentual em massa de agregados friáveis e desmancháveis sob pressão dos dedos.',
        sampleType: 'Agregado Graúdo e Miúdo',
        defaultUnit: '%',
        nominalExpected: 'Teor de Torrões ≤ 1,5% (CBUQ) / ≤ 1,0% (Concreto)',
        benchFields: [
            { key: 'massa_inicial_amostra', label: 'Massa da Fração de Teste', unit: 'g', placeholder: 'Ex: 1000.0' },
            { key: 'massa_retida_apos_atrito', label: 'Massa Retida após Destorroamento e Lavagem', unit: 'g', placeholder: 'Ex: 994.2' }
        ]
    },
    {
        id: 'ag-sanidade',
        code: 'DNIT-411-SANIDADE',
        module: 'agregados',
        name: 'Sanidade / Durabilidade por Sulfato de Sódio',
        norm: 'DNIT 411/2019-ME / DNER-ME 089',
        description: 'Resistência ao intemperismo acelerado após 5 ciclos de imersão em solução de sulfato de sódio e secagem.',
        sampleType: 'Agregado Graúdo Britado da Pedreira',
        defaultUnit: '% perda',
        nominalExpected: 'Perda de Massa ≤ 12% (Sulfato de Sódio) / ≤ 18% (Sulfato de Magnésio)',
        benchFields: [
            { key: 'massa_inicial_ciclos', label: 'Massa Total Inicial Pré-Ciclos', unit: 'g', placeholder: 'Ex: 2500.0' },
            { key: 'massa_final_lavada', label: 'Massa Retida Seca Pós 5 Ciclos', unit: 'g', placeholder: 'Ex: 2362.5' },
            { key: 'tipo_solucao', label: 'Solução Saturada Utilizada', unit: 'tipo', placeholder: 'Ex: Na2SO4 (Sulfato de Sódio)' }
        ]
    },
    {
        id: 'ag-finos-200',
        code: 'DNER-054-FINOS',
        module: 'agregados',
        name: 'Material Passante na Peneira Nº 200 (75 µm) por Lavagem',
        norm: 'DNER-ME 054/97 / NBR NM 46',
        description: 'Quantificação precisa de poeiras de britagem e argilas carreadas por via úmida.',
        sampleType: 'Agregado Graúdo e Areia',
        defaultUnit: '%',
        nominalExpected: 'Brita Graúda: ≤ 1,5% | Agregado Miúdo: ≤ 4,0%',
        benchFields: [
            { key: 'massa_amostra_seca_antes', label: 'Massa Seca Antes da Lavagem', unit: 'g', placeholder: 'Ex: 2500.0' },
            { key: 'massa_amostra_seca_apos', label: 'Massa Seca Retida após Lavagem Nº 200', unit: 'g', placeholder: 'Ex: 2472.5' }
        ]
    },

    // -------------------------------------------------------------------------
    // 2. MÓDULO MASSAS ASFÁLTICAS / CBUQ / LIGANTES (DNIT)
    // -------------------------------------------------------------------------
    {
        id: 'asf-temp',
        code: 'DNIT-031-TEMP',
        module: 'asfalto',
        name: 'Controle Térmico de Usina e Pista',
        norm: 'DNIT 031/2006-ES',
        description: 'Rastreamento termométrico: saída da usina, caminhão térmico, chegada na pista e início do rolamento.',
        sampleType: 'Massa Asfáltica CBUQ em Caminhão e Pista',
        defaultUnit: '°C',
        nominalExpected: 'Usina: 145°C - 175°C | Chegada Pista: ≥ 135°C | Rolamento: ≥ 120°C',
        benchFields: [
            { key: 'temp_ligante_tanque', label: 'Temp. Ligante CAP no Tanque', unit: '°C', placeholder: 'Ex: 155' },
            { key: 'temp_agregados_secador', label: 'Temp. Agregados no Secador', unit: '°C', placeholder: 'Ex: 165' },
            { key: 'temp_saida_usina', label: 'Temp. Massa Saída Usina', unit: '°C', placeholder: 'Ex: 162' },
            { key: 'temp_chegada_pista', label: 'Temp. Chegada na Pista', unit: '°C', placeholder: 'Ex: 148' },
            { key: 'temp_inicio_rolamento', label: 'Temp. Início Compactação Rolos', unit: '°C', placeholder: 'Ex: 132' }
        ]
    },
    {
        id: 'asf-betume',
        code: 'DNIT-144-BETUME',
        module: 'asfalto',
        name: 'Teor de Ligante Asfáltico (Betume)',
        norm: 'DNIT 144/2014-ME',
        description: 'Determinação do teor de asfalto pelo extrator centrífugo Rotarex ou fornalha de calcinação NCAT.',
        sampleType: 'Batelada CBUQ Coletada na Saída do Misturador',
        defaultUnit: '% ligante',
        nominalExpected: 'Teor Projeto Pb ± 0,30% (Ex: 5,20% ± 0,30% => 4,90% a 5,50%)',
        benchFields: [
            { key: 'teor_projeto', label: 'Teor de Projeto de Referência (Pb)', unit: '%', placeholder: 'Ex: 5.20' },
            { key: 'massa_inicial_mistura', label: 'Massa Inicial Seca da Mistura (Mi)', unit: 'g', placeholder: 'Ex: 1200.0' },
            { key: 'massa_agregados_recuperados', label: 'Massa Agregados Secos Extraídos (Mf)', unit: 'g', placeholder: 'Ex: 1136.2' },
            { key: 'massa_filler_filtro', label: 'Finos Retidos no Papel Filtro (Me)', unit: 'g', placeholder: 'Ex: 3.4' }
        ]
    },
    {
        id: 'asf-marshall',
        code: 'DNIT-043-MARSHALL',
        module: 'asfalto',
        name: 'Ensaio Marshall Completo',
        norm: 'DNIT 043/2006-ME',
        description: 'Parâmetros mecânicos e volumétricos: Estabilidade, Fluência, Vazios Vv, VAM e RBV.',
        sampleType: 'Corpos de Prova Cilíndricos Moldados (75 golpes/face)',
        defaultUnit: 'kgf / mm / %',
        nominalExpected: 'Estabilidade ≥ 800 kgf | Fluência: 2,0 - 4,5 mm | Vv: 3,0% - 5,0% | RBV: 75% - 82%',
        benchFields: [
            { key: 'estabilidade_kgf', label: 'Estabilidade Corrigida da Prensa', unit: 'kgf', placeholder: 'Ex: 1180' },
            { key: 'fluencia_mm', label: 'Fluência Medida no Extensômetro', unit: 'mm', placeholder: 'Ex: 3.2' },
            { key: 'densidade_aparente_gmb', label: 'Densidade Aparente CP (Gmb)', unit: 'g/cm³', placeholder: 'Ex: 2.385' },
            { key: 'densidade_maxima_gmm', label: 'Densidade Máx. Teórica Rice (Gmm)', unit: 'g/cm³', placeholder: 'Ex: 2.488' },
            { key: 'vam_percent', label: 'Vazios do Agregado Mineral (VAM)', unit: '%', placeholder: 'Ex: 15.4' }
        ]
    },
    {
        id: 'asf-faixa',
        code: 'DNIT-031-FAIXA',
        module: 'asfalto',
        name: 'Enquadramento Granulométrico (Faixas DNIT)',
        norm: 'DNIT 031/2006-ES',
        description: 'Verificação da curva granulométrica extraída nas faixas de projeto A (Binder), B ou C (Capa Delgada).',
        sampleType: 'Agregado Mineral Extraído da Mistura Asfáltica',
        defaultUnit: '% passante',
        nominalExpected: '100% dos pontos dentro do envelope da Faixa DNIT selecionada',
        benchFields: [
            { key: 'faixa_selecionada', label: 'Faixa de Projeto (A, B ou C)', unit: 'DNIT', placeholder: 'Ex: Faixa C' },
            { key: 'passante_peneira_3_8', label: 'Passante Peneira 3/8" (9,5 mm)', unit: '%', placeholder: 'Ex: 84.5 (Faixa C: 70-90)' },
            { key: 'passante_peneira_n4', label: 'Passante Peneira Nº 4 (4,75 mm)', unit: '%', placeholder: 'Ex: 58.2 (Faixa C: 44-72)' },
            { key: 'passante_peneira_n40', label: 'Passante Peneira Nº 40 (0,42 mm)', unit: '%', placeholder: 'Ex: 21.0 (Faixa C: 13-30)' },
            { key: 'passante_peneira_n200', label: 'Passante Peneira Nº 200 (0,075 mm)', unit: '%', placeholder: 'Ex: 6.2 (Faixa C: 4-10)' }
        ]
    },
    {
        id: 'asf-rt',
        code: 'DNIT-135-RT',
        module: 'asfalto',
        name: 'Resistência à Tração por Compressão Diametral (RT)',
        norm: 'DNIT 135/2018-ME',
        description: 'Avaliação da tenacidade e resistência à fissuração por fadiga a 25°C sob carga estática diametral.',
        sampleType: 'Corpos de Prova Marshall (101,6 mm x 63,5 mm)',
        defaultUnit: 'MPa',
        nominalExpected: 'RT ≥ 0,65 MPa (CAP Convencional) / ≥ 0,80 MPa (Asfalto Polímero)',
        benchFields: [
            { key: 'carga_ruptura_kn', label: 'Carga Máxima de Ruptura (P)', unit: 'kN', placeholder: 'Ex: 14.8' },
            { key: 'diametro_cp_mm', label: 'Diâmetro do CP (D)', unit: 'mm', placeholder: 'Ex: 101.6' },
            { key: 'altura_cp_mm', label: 'Altura do CP (H)', unit: 'mm', placeholder: 'Ex: 63.5' }
        ]
    },
    {
        id: 'asf-gc-pista',
        code: 'DNIT-031-GC',
        module: 'asfalto',
        name: 'Grau de Compactação de Pista (GC / Testemunho)',
        norm: 'DNIT 031/2006-ES',
        description: 'Determinação da massa específica in situ por corpo de prova extraído com sonda rotativa (tepeque).',
        sampleType: 'Testemunho Extraído de Pista (Carotilha)',
        defaultUnit: '% GC',
        nominalExpected: '97,0% ≤ GC ≤ 102,0% da densidade média de projeto',
        benchFields: [
            { key: 'densidade_in_situ_g_cm3', label: 'Densidade Aparente do Testemunho (Gmb)', unit: 'g/cm³', placeholder: 'Ex: 2.375' },
            { key: 'densidade_projeto_g_cm3', label: 'Densidade de Referência de Projeto', unit: 'g/cm³', placeholder: 'Ex: 2.420' },
            { key: 'estaca_km_extracao', label: 'Estaca / Quilômetro da Extração', unit: 'km', placeholder: 'Ex: Km 182+400 Pista Sul' },
            { key: 'espessura_camada_cm', label: 'Espessura Medida da Camada', unit: 'cm', placeholder: 'Ex: 5.2 (Projeto: 5.0 cm)' }
        ]
    },
    {
        id: 'asf-rtr-lottman',
        code: 'DNIT-180-RTR',
        module: 'asfalto',
        name: 'Dano por Umidade Induzida (RTR / Lottman)',
        norm: 'DNIT 180/2018-ME',
        description: 'Resistência à tração indireta retida após saturação com vácuo e ciclo de congelamento/degelo acelerado.',
        sampleType: 'Corpos de Prova Marshall Condicionados vs. Secos',
        defaultUnit: '% RTR',
        nominalExpected: 'RTR ≥ 80,0% (DNIT 031/2006-ES)',
        benchFields: [
            { key: 'rt_amostra_seca_mpa', label: 'RT Média do Grupo Seco (Controle)', unit: 'MPa', placeholder: 'Ex: 0.95' },
            { key: 'rt_amostra_condicionada_mpa', label: 'RT Média do Grupo Condicionado (Úmido)', unit: 'MPa', placeholder: 'Ex: 0.82' }
        ]
    },
    {
        id: 'asf-mr',
        code: 'DNIT-136-MR',
        module: 'asfalto',
        name: 'Módulo de Resiliência de Misturas Asfálticas (MR)',
        norm: 'DNIT 136/2018-ME',
        description: 'Determinação do módulo de elasticidade dinâmico sob pulsos cíclicos de carga diametral repetida.',
        sampleType: 'Corpos de Prova Cilíndricos a 25°C e freq. 10 Hz',
        defaultUnit: 'MPa',
        nominalExpected: 'MR ≥ 3.000 MPa a 25°C (Requisito Estrutural Rodoviário MeDiNa)',
        benchFields: [
            { key: 'tensao_repetida_mpa', label: 'Tensão de Tração Aplicada (σ)', unit: 'MPa', placeholder: 'Ex: 0.15' },
            { key: 'deformacao_resiliente_um', label: 'Deformação Horizontal Recuperável (ε)', unit: 'µm', placeholder: 'Ex: 48.0' },
            { key: 'temperatura_ensaio', label: 'Temperatura da Câmara Térmica', unit: '°C', placeholder: 'Ex: 25.0' }
        ]
    },
    {
        id: 'asf-saybolt',
        code: 'DNER-004-SAYBOLT',
        module: 'asfalto',
        name: 'Viscosidade Saybolt-Furol do Ligante Asfáltico',
        norm: 'DNER-ME 004/94 / NBR 14950',
        description: 'Tempo de escoamento do ligante em orifício Furol a 135°C, 150°C e 177°C para curva de usinagem.',
        sampleType: 'Amostra de CAP 50/70 ou CAP 30/45 do Tanque',
        defaultUnit: 'SSF',
        nominalExpected: 'Usinagem: 75 a 150 SSF | Compactação: 150 a 300 SSF',
        benchFields: [
            { key: 'ssf_a_135c', label: 'Viscosidade Furol a 135°C', unit: 'SSF', placeholder: 'Ex: 285' },
            { key: 'ssf_a_150c', label: 'Viscosidade Furol a 150°C', unit: 'SSF', placeholder: 'Ex: 140' },
            { key: 'ssf_a_177c', label: 'Viscosidade Furol a 177°C', unit: 'SSF', placeholder: 'Ex: 68' }
        ]
    },
    {
        id: 'asf-anel-bola',
        code: 'DNER-005-ANEL-BOLA',
        module: 'asfalto',
        name: 'Ponto de Amolecimento do Asfalto (Anel e Bola)',
        norm: 'DNER-ME 005/94 / NBR 6560',
        description: 'Temperatura na qual o ligante asfáltico amolece e cede sob o peso de esfera de aço de 3,5g.',
        sampleType: 'Cimento Asfáltico de Petróleo (CAP)',
        defaultUnit: '°C',
        nominalExpected: 'CAP 50/70: ≥ 46°C | CAP 30/45: ≥ 50°C | Polímero: ≥ 60°C',
        benchFields: [
            { key: 'temp_amolecimento_1', label: 'Temperatura Rompimento Anel 1', unit: '°C', placeholder: 'Ex: 48.5' },
            { key: 'temp_amolecimento_2', label: 'Temperatura Rompimento Anel 2', unit: '°C', placeholder: 'Ex: 49.0' },
            { key: 'tipo_ligante', label: 'Classificação Nominal do Ligante', unit: 'tipo', placeholder: 'Ex: CAP 50/70 Petrobras' }
        ]
    },
    {
        id: 'asf-penetracao',
        code: 'DNER-009-PENETRACAO',
        module: 'asfalto',
        name: 'Penetração do Ligante Asfáltico a 25°C',
        norm: 'DNER-ME 009/94 / NBR 6576',
        description: 'Profundidade em décimos de milímetro que agulha calibrada de 100g penetra no CAP durante 5 segundos a 25°C.',
        sampleType: 'Cimento Asfáltico de Petróleo (CAP)',
        defaultUnit: 'dmm (0,1 mm)',
        nominalExpected: 'CAP 50/70: 50 a 70 dmm | CAP 30/45: 30 a 45 dmm',
        benchFields: [
            { key: 'leitura_pen_1', label: 'Determinação 1', unit: '0,1 mm', placeholder: 'Ex: 58' },
            { key: 'leitura_pen_2', label: 'Determinação 2', unit: '0,1 mm', placeholder: 'Ex: 61' },
            { key: 'leitura_pen_3', label: 'Determinação 3', unit: '0,1 mm', placeholder: 'Ex: 59' }
        ]
    },
    {
        id: 'asf-emulsao',
        code: 'DNIT-107-EMULSAO',
        module: 'asfalto',
        name: 'Controle de Emulsão Asfáltica Catiônica',
        norm: 'DNIT 107/2009-EM / ABNT NBR 6567',
        description: 'Ensaios de recepção de emulsão RR-1C / RR-2C: resíduo por evaporação, carga da partícula e peneiramento.',
        sampleType: 'Emulsão Asfáltica para Pintura de Ligação ou Imprimação',
        defaultUnit: '% resíduo',
        nominalExpected: 'Resíduo ≥ 60% (RR-1C) | Carga Positiva (+) | Peneiramento ≤ 0,10%',
        benchFields: [
            { key: 'residuo_evaporacao_percent', label: 'Resíduo por Evaporação (163°C)', unit: '%', placeholder: 'Ex: 62.4' },
            { key: 'carga_particula', label: 'Carga Elétrica da Partícula', unit: 'polaridade', placeholder: 'Ex: Positiva (Catiônica)' },
            { key: 'retido_peneira_084mm', label: 'Peneiramento (Retido na peneira 0,84mm)', unit: '%', placeholder: 'Ex: 0.04' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. MÓDULO CONCRETO USINADO (ABNT / DNIT 049/2013-ES)
    // -------------------------------------------------------------------------
    {
        id: 'cnc-slump',
        code: 'NBR-NM-67-SLUMP',
        module: 'concreto',
        name: 'Abatimento de Tronco de Cone (Slump Test)',
        norm: 'ABNT NBR NM 67 / DNIT 049-ES',
        description: 'Verificação instantânea da trabalhabilidade e consistência do concreto fresco no descarregamento.',
        sampleType: 'Batelada Caminhão Betoneira na Usina ou Pista',
        defaultUnit: 'cm',
        nominalExpected: 'Pavimento Rígido: 3,0 ± 1,0 cm | Estrutural: 10,0 ± 2,0 cm | Bombeável: 16,0 ± 3,0 cm',
        benchFields: [
            { key: 'slump_projeto', label: 'Slump Nominal de Projeto', unit: 'cm', placeholder: 'Ex: 10.0' },
            { key: 'slump_medido', label: 'Slump Medido na Régua', unit: 'cm', placeholder: 'Ex: 9.5' },
            { key: 'tolerancia_normativa', label: 'Tolerância Admissível (NBR 7212)', unit: '± cm', placeholder: 'Ex: 2.0' },
            { key: 'aspecto_mistura', label: 'Aspecto Visual / Coesão', unit: 'obs', placeholder: 'Ex: Coeso, sem segregação' }
        ]
    },
    {
        id: 'cnc-fck',
        code: 'NBR-5739-FCK',
        module: 'concreto',
        name: 'Resistência à Compressão Axial (fck)',
        norm: 'ABNT NBR 5739 / NBR 12655',
        description: 'Ruptura na prensa hidráulica de corpos de prova cilíndricos (10x20 cm) em idades de controle.',
        sampleType: 'Corpos de Prova Cilíndricos em Cura Úmida',
        defaultUnit: 'MPa',
        nominalExpected: 'Aos 7 dias: ≥ 70% fck nominal | Aos 28 dias: ≥ 100% fck nominal',
        benchFields: [
            { key: 'fck_nominal_projeto', label: 'fck de Projeto Nominal', unit: 'MPa', placeholder: 'Ex: 30.0' },
            { key: 'idade_dias', label: 'Idade de Rompimento', unit: 'dias', placeholder: 'Ex: 28' },
            { key: 'forca_prensa_kn', label: 'Força Máxima na Prensa Hidráulica', unit: 'kN', placeholder: 'Ex: 275.0' },
            { key: 'diametro_cilindro_cm', label: 'Diâmetro do Cilindro', unit: 'cm', placeholder: 'Ex: 10.0' },
            { key: 'tipo_ruptura', label: 'Tipo de Ruptura (Cônica, Cisalhamento)', unit: 'modo', placeholder: 'Ex: Cônica Perfeita' }
        ]
    },
    {
        id: 'cnc-fctm',
        code: 'DNIT-049-FCTM',
        module: 'concreto',
        name: 'Tração na Flexão em Vigas (Módulo Ruptura)',
        norm: 'DNIT 049/2013-ES / NBR 12142',
        description: 'Resistência à tração por flexão em prismas (15x15x50 cm) sob duas cargas concentradas.',
        sampleType: 'Prismas Moldados para Pavimento Rígido Rodoviário',
        defaultUnit: 'MPa',
        nominalExpected: 'fctM,k ≥ 4,5 MPa aos 28 dias (Mínimo DNIT para placas de concreto)',
        benchFields: [
            { key: 'carga_flexao_kn', label: 'Carga de Ruptura nos Cutelos (P)', unit: 'kN', placeholder: 'Ex: 34.5' },
            { key: 'vao_livre_l_cm', label: 'Vão Livre entre Apoios (L)', unit: 'cm', placeholder: 'Ex: 45.0' },
            { key: 'largura_b_cm', label: 'Largura da Seção (b)', unit: 'cm', placeholder: 'Ex: 15.0' },
            { key: 'altura_h_cm', label: 'Altura da Seção (h)', unit: 'cm', placeholder: 'Ex: 15.0' }
        ]
    },
    {
        id: 'cnc-ac',
        code: 'NBR-6118-AC',
        module: 'concreto',
        name: 'Relação Água/Cimento (a/c) e Durabilidade',
        norm: 'ABNT NBR 6118 / DNIT 049-ES',
        description: 'Controle estequiométrico de hidratação e porosidade da matriz de pasta de cimento.',
        sampleType: 'Batelada Pesada nas Balanças da Usina',
        defaultUnit: 'adim.',
        nominalExpected: 'a/c ≤ 0,45 (Pavimento Rígido) / ≤ 0,50 (Concreto Estrutural CAC III)',
        benchFields: [
            { key: 'agua_efetiva_litros', label: 'Água Efetiva Adicionada', unit: 'litros', placeholder: 'Ex: 175.0' },
            { key: 'consumo_cimento_kg', label: 'Cimento Portland Total Pesado', unit: 'kg', placeholder: 'Ex: 400.0' },
            { key: 'umidade_areia_percent', label: 'Teor de Umidade da Areia Compensada', unit: '%', placeholder: 'Ex: 4.2' },
            { key: 'ar_incorporado_percent', label: 'Teor de Ar Incorporado Medido', unit: '%', placeholder: 'Ex: 1.5' }
        ]
    },
    {
        id: 'cnc-ar-incorporado',
        code: 'NBR-NM-47-AR',
        module: 'concreto',
        name: 'Teor de Ar Incorporado no Concreto Fresco',
        norm: 'ABNT NBR NM 47 / DNIT 049-ES',
        description: 'Determinação volumétrica pelo método pressométrico (aparelho de Washington).',
        sampleType: 'Concreto Fresco com Aditivo Incorporador de Ar',
        defaultUnit: '% ar',
        nominalExpected: 'Pavimentos de Rodovia: 4,5% ± 1,5% (Faixa: 3,0% a 6,0%)',
        benchFields: [
            { key: 'pressao_inicial_bar', label: 'Calibração da Câmara de Pressão', unit: 'bar', placeholder: 'Ex: 1.0' },
            { key: 'leitura_manometro_ar', label: 'Leitura Direta de Ar no Manômetro', unit: '%', placeholder: 'Ex: 4.6' }
        ]
    },
    {
        id: 'cnc-rt-diametral',
        code: 'NBR-7222-RT-DIAM',
        module: 'concreto',
        name: 'Tração por Compressão Diametral do Concreto',
        norm: 'ABNT NBR 7222 (Método Brasileiro)',
        description: 'Resistência à tração indireta por carregamento linear ao longo da geratriz de cilindro 15x30 cm.',
        sampleType: 'Corpos de Prova Cilíndricos em Cura Normal',
        defaultUnit: 'MPa',
        nominalExpected: 'fct,sp ≥ 3,0 MPa aos 28 dias',
        benchFields: [
            { key: 'forca_ruptura_kn', label: 'Força Máxima de Ruptura (F)', unit: 'kN', placeholder: 'Ex: 215.0' },
            { key: 'diametro_d_cm', label: 'Diâmetro do Cilindro (d)', unit: 'cm', placeholder: 'Ex: 15.0' },
            { key: 'comprimento_l_cm', label: 'Comprimento do Cilindro (L)', unit: 'cm', placeholder: 'Ex: 30.0' }
        ]
    },
    {
        id: 'cnc-absorcao-vazios',
        code: 'NBR-9778-ABS-VAZIOS',
        module: 'concreto',
        name: 'Absorção de Água por Imersão e Índice de Vazios',
        norm: 'ABNT NBR 9778',
        description: 'Determinação da porosidade permeável do concreto endurecido por fervura e pesagem hidrostática.',
        sampleType: 'Testemunhos ou Prismas de Concreto Endurecido',
        defaultUnit: '% absorção',
        nominalExpected: 'Absorção ≤ 5,0% | Índice de Vazios ≤ 12,0%',
        benchFields: [
            { key: 'massa_seca_estufa_ms', label: 'Massa Seca em Estufa (Ms)', unit: 'g', placeholder: 'Ex: 2450.0' },
            { key: 'massa_saturada_fervida_msat', label: 'Massa Saturada Pós-Fervura (Msat)', unit: 'g', placeholder: 'Ex: 2548.0' },
            { key: 'massa_submersa_mi', label: 'Massa Submersa em Água (Mi)', unit: 'g', placeholder: 'Ex: 1485.0' }
        ]
    },
    {
        id: 'cnc-espessura-placa',
        code: 'DNIT-049-ESPESSURA',
        module: 'concreto',
        name: 'Espessura de Placa de Pavimento Rígido',
        norm: 'DNIT 049/2013-ES / DNER-PRO 102',
        description: 'Medição com paquímetro de precisão em 9 pontos de testemunho extraído da pista de concreto.',
        sampleType: 'Testemunho Cilíndrico Extraído da Placa de Rolamento',
        defaultUnit: 'cm',
        nominalExpected: 'Espessura Média ≥ Espessura de Projeto (Tolerância individual máx: -5 mm)',
        benchFields: [
            { key: 'espessura_nominal_projeto', label: 'Espessura de Projeto da Placa', unit: 'cm', placeholder: 'Ex: 22.0' },
            { key: 'leitura_media_paquimetro', label: 'Espessura Média Medida no Testemunho', unit: 'cm', placeholder: 'Ex: 22.4' },
            { key: 'estaca_km_placa', label: 'Estaca / Posição da Placa', unit: 'km', placeholder: 'Ex: Estaca 3420 Pista Norte' }
        ]
    }
];

export const INITIAL_DNIT_LAB_TESTS: DNITLabTest[] = [
    {
        id: 'lab-init-1',
        module: 'asfalto',
        testCode: 'DNIT-144-BETUME',
        testName: 'Teor de Ligante Asfáltico (Betume)',
        standardNorm: 'DNIT 144/2014-ME',
        sampleType: 'Batelada CBUQ Coletada na Saída do Misturador',
        batchNumber: 'L1024-CBUQ-01',
        orderNumber: 'OP-2026-001',
        productName: 'Concreto Asfáltico CBUQ Faixa C',
        unitName: 'Usina Asfalto Contínua Ciber 120t/h',
        testedAt: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0],
        tester: 'Eng. Marcelo Antunes - Lab Rodovias',
        supervisor: 'Dra. Camila Silveira - CREA 198420-D/SP',
        nominalExpected: '5,20% ± 0,30% (4,90% a 5,50%)',
        resultValue: '5,22% de Ligante CAP 50/70',
        status: 'Aprovado',
        notes: 'Ensaio realizado por extração centrífuga Rotarex. O teor de betume atende rigorosamente a tolerância normativa do projeto DNIT 031/2006-ES.',
        benchData: {
            teor_projeto: 5.20,
            massa_inicial_mistura: 1200.0,
            massa_agregados_recuperados: 1134.2,
            massa_filler_filtro: 3.1
        },
        metricsCalculated: {
            teor_extraido: 5.22,
            desvio_projeto: '+0.02%'
        }
    },
    {
        id: 'lab-init-2',
        module: 'asfalto',
        testCode: 'DNIT-043-MARSHALL',
        testName: 'Ensaio Marshall Completo',
        standardNorm: 'DNIT 043/2006-ME',
        sampleType: 'Corpos de Prova Cilíndricos Moldados (75 golpes/face)',
        batchNumber: 'L1024-CBUQ-01',
        orderNumber: 'OP-2026-001',
        productName: 'Concreto Asfáltico CBUQ Faixa C',
        unitName: 'Usina Asfalto Contínua Ciber 120t/h',
        testedAt: new Date(Date.now() - 3600000 * 4).toISOString().split('T')[0],
        tester: 'Eng. Marcelo Antunes - Lab Rodovias',
        supervisor: 'Dra. Camila Silveira - CREA 198420-D/SP',
        nominalExpected: 'Estabilidade ≥ 800 kgf | Fluência: 2,0 - 4,5 mm | Vv: 3 - 5% | RBV: 75 - 82%',
        resultValue: 'Estabilidade: 1.185 kgf | Fluência: 3,1 mm | Vv: 4,1% | RBV: 77,5%',
        status: 'Aprovado',
        notes: 'Parâmetros mecânicos e volumétricos plenamente conformes para tráfego rodoviário pesado (Classe de Tráfego N > 10^7).',
        benchData: {
            estabilidade_kgf: 1185,
            fluencia_mm: 3.1,
            densidade_aparente_gmb: 2.385,
            densidade_maxima_gmm: 2.488,
            vam_percent: 15.4
        },
        metricsCalculated: {
            vv_calculado: '4.14%',
            rbv_calculado: '77.5%'
        }
    },
    {
        id: 'lab-init-3',
        module: 'agregados',
        testCode: 'DNIT-078-EA',
        testName: 'Equivalente de Areia (EA)',
        standardNorm: 'DNIT 078/2006-ME',
        sampleType: 'Pó de Pedra Lavado / Agregado Miúdo Britado',
        batchNumber: 'PILHA-PO-2026-03',
        productName: 'Pó de Pedra de Britagem Basáltica',
        unitName: 'Planta Britagem Primária/Secundária',
        testedAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        tester: 'Téc. Fernando Ramos',
        supervisor: 'Eng. Roberto Vasconcelos - CREA 142109-D/PR',
        nominalExpected: 'EA ≥ 55% (DNIT 031/2006-ES)',
        resultValue: 'EA = 66,7%',
        status: 'Aprovado',
        notes: 'Agregado miúdo limpo com baixíssimo teor de argilas deletérias. Aprovado para dosagem de CBUQ e concreto estrutural.',
        benchData: {
            h1_areia: 6.8,
            h2_argila: 10.2,
            temperatura_solucao: 22
        },
        metricsCalculated: {
            ea_percent: 66.7
        }
    },
    {
        id: 'lab-init-4',
        module: 'agregados',
        testCode: 'DNER-035-LA',
        testName: 'Abrasão Los Angeles',
        standardNorm: 'DNER-ME 035/98 / DNIT 031-ES',
        sampleType: 'Brita 1 Basalto (9,5 mm a 19,0 mm)',
        batchNumber: 'PILHA-B1-2026-09',
        productName: 'Brita 1 Granítica/Basáltica',
        unitName: 'Planta Britagem Primária/Secundária',
        testedAt: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        tester: 'Téc. Fernando Ramos',
        supervisor: 'Eng. Roberto Vasconcelos - CREA 142109-D/PR',
        nominalExpected: 'Desgaste ≤ 40% (CBUQ)',
        resultValue: 'Perda por abrasão: 27,6%',
        status: 'Aprovado',
        notes: 'Excelente tenacidade e sanidade mineral do maciço rochoso da pedreira, apto para capas de rolamento de alto atrito.',
        benchData: {
            m1_inicial: 5000,
            m2_retida12: 3620,
            graduacao: 'Graduação B (11 esferas)'
        },
        metricsCalculated: {
            desgaste_la: '27.6%'
        }
    },
    {
        id: 'lab-init-5',
        module: 'concreto',
        testCode: 'NBR-NM-67-SLUMP',
        testName: 'Abatimento de Tronco de Cone (Slump Test)',
        standardNorm: 'ABNT NBR NM 67 / DNIT 049-ES',
        sampleType: 'Concreto Usinado fck 35 MPa - Caminhão Betoneira 08',
        batchNumber: 'L1024-CNC-04',
        orderNumber: 'OP-2026-003',
        productName: 'Concreto Usinado Estrutural fck 35 MPa',
        unitName: 'Central Dosadora de Concreto Liebherr 60m³/h',
        testedAt: new Date(Date.now() - 3600000 * 3).toISOString().split('T')[0],
        tester: 'Laboratorista João Batista',
        supervisor: 'Dra. Camila Silveira - CREA 198420-D/SP',
        nominalExpected: '10,0 ± 2,0 cm (Faixa aceitável: 8,0 a 12,0 cm)',
        resultValue: 'Slump obtido: 9,5 cm',
        status: 'Aprovado',
        notes: 'Mistura homogênea, coesa e com exsudação desprezível. Liberada descarga imediata para concretagem dos pilares da OAE.',
        benchData: {
            slump_projeto: 10.0,
            slump_medido: 9.5,
            tolerancia_normativa: 2.0,
            aspecto_mistura: 'Coeso, excelente plasticidade'
        }
    },
    {
        id: 'lab-init-6',
        module: 'asfalto',
        testCode: 'DNIT-031-TEMP',
        testName: 'Controle Térmico de Usina e Pista',
        standardNorm: 'DNIT 031/2006-ES',
        sampleType: 'Caminhão Truck Caçamba 04 - Estaca 1420 da Rodovia',
        batchNumber: 'L1024-CBUQ-02',
        orderNumber: 'OP-2026-001',
        productName: 'Concreto Asfáltico CBUQ Faixa C',
        unitName: 'Usina Asfalto Contínua Ciber 120t/h',
        testedAt: new Date(Date.now() - 3600000 * 2).toISOString().split('T')[0],
        tester: 'Eng. Marcelo Antunes - Lab Rodovias',
        supervisor: 'Dra. Camila Silveira - CREA 198420-D/SP',
        nominalExpected: 'Usina: 145-175°C | Chegada: ≥ 135°C | Rolamento: ≥ 120°C',
        resultValue: 'Usina: 164°C | Chegada: 142°C | Rolamento: 128°C',
        status: 'Aprovado',
        notes: 'Cobertura com lona térmica dupla preservou o calor latente durante transporte de 35 km até a frente de pavimentação.',
        benchData: {
            temp_ligante_tanque: 155,
            temp_agregados_secador: 168,
            temp_saida_usina: 164,
            temp_chegada_pista: 142,
            temp_inicio_rolamento: 128
        }
    },
    {
        id: 'lab-init-7',
        module: 'solos',
        testCode: 'DNER-092-FRASCO-AREIA',
        testName: 'Massa Específica In Situ e Grau de Compactação (Frasco de Areia)',
        standardNorm: 'DNER-ME 092/94 / NBR 7185',
        sampleType: 'Camada de Regularização do Subleito - Pista Sul',
        batchNumber: 'TERRA-ESTACA-1240',
        locationOrStation: 'Rodovia BR-116, Estaca 1240+00 Pista Sul',
        supplierOrQuarry: 'Corte Km 12+800 da Faixa de Domínio',
        productName: 'Solo Argilo-Arenoso Compactado de Subleito',
        unitName: 'Frente de Terraplenagem e Obras de Arte',
        testedAt: new Date(Date.now() - 3600000 * 6).toISOString().split('T')[0],
        tester: 'Eng. Geotécnico Rafael Menezes',
        supervisor: 'Dra. Camila Silveira - CREA 198420-D/SP',
        nominalExpected: 'GC ≥ 100,0% do Ensaio Proctor Intermediário',
        resultValue: 'GC = 100,8% (γd = 1.855 g/cm³ | w = 13,6%)',
        status: 'Aprovado',
        notes: 'Compactação homogênea com rolo pé-de-carneiro e acabamento com liso vibratório. Camada plenamente liberada para imprimação.',
        benchData: {
            massa_solo_umido_g: 3480.0,
            massa_areia_utilizada_g: 2420.0,
            densidade_areia_padrao: 1.420,
            umidade_campo_percent: 13.6,
            densidade_seca_max_proctor: 1.840,
            gc_minimo_exigido: 100.0
        },
        metricsCalculated: {
            volume_furo_cm3: 1704.2,
            densidade_seca_in_situ: 1.855,
            grau_compactacao: '100.8%'
        }
    },
    {
        id: 'lab-init-8',
        module: 'solos',
        testCode: 'DNIT-172-CBR',
        testName: 'Índice de Suporte Califórnia (CBR / ISC) e Expansão',
        standardNorm: 'DNIT 172/2016-ME / DNER-ME 049',
        sampleType: 'Amostra de Solo da Jazida Morro Alto para Reforço',
        batchNumber: 'JAZIDA-MA-CP-04',
        locationOrStation: 'Jazida Morro Alto - Amostra Furo TR-03',
        supplierOrQuarry: 'Jazida Morro Alto (Licenciamento Ambiental nº 482/2024)',
        productName: 'Solo Saibroso com Cascalho Fino',
        unitName: 'Laboratório Central Geotécnico',
        testedAt: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        tester: 'Laboratorista João Batista',
        supervisor: 'Eng. Roberto Vasconcelos - CREA 142109-D/PR',
        nominalExpected: 'CBR ≥ 12,0% | Expansão ≤ 1,0%',
        resultValue: 'CBR = 14,8% | Expansão = 0,35%',
        status: 'Aprovado',
        notes: 'Material geotécnico nobre com baixa expansibilidade e excelente capacidade portante após imersão de 96h.',
        benchData: {
            cbr_calculado_percent: 14.8,
            cbr_minimo_projeto: 12.0,
            expansao_percent: 0.35,
            expansao_maxima_tolerada: 1.0
        }
    },
    {
        id: 'lab-init-9',
        module: 'solos',
        testCode: 'DNER-122-ATTERBERG',
        testName: 'Limites de Consistência de Atterberg (LL, LP e IP)',
        standardNorm: 'DNER-ME 122/94 / DNER-ME 082/94',
        sampleType: 'Solo Fino Passante na Peneira Nº 40 (0,42 mm)',
        batchNumber: 'JAZIDA-MA-CP-04',
        locationOrStation: 'Jazida Morro Alto - Amostra Furo TR-03',
        supplierOrQuarry: 'Jazida Morro Alto (Licenciamento Ambiental nº 482/2024)',
        productName: 'Fração Fina do Solo Saibroso',
        unitName: 'Laboratório Central Geotécnico',
        testedAt: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        tester: 'Laboratorista João Batista',
        supervisor: 'Eng. Roberto Vasconcelos - CREA 142109-D/PR',
        nominalExpected: 'IP ≤ 12,0% | LL ≤ 35,0%',
        resultValue: 'LL = 28,4% | LP = 19,1% | IP = 9,3%',
        status: 'Aprovado',
        notes: 'Solo medianamente plástico com baixo risco de deformações plásticas excessivas por umidade.',
        benchData: {
            limite_liquidez_ll: 28.4,
            limite_plasticidade_lp: 19.1,
            ip_maximo_tolerado: 12.0
        },
        metricsCalculated: {
            ip_calculado: 9.3,
            classificacao_consistencia: 'Medianamente Plástico'
        }
    }
];

export const generateTestSvgDiagram = (test: DNITLabTest): string => {
    const code = (test.testCode || '').toUpperCase();
    const name = (test.testName || '').toLowerCase();
    const category = (test.module || test.category || '').toLowerCase();
    const bench = test.benchData || {};
    const metrics = test.metricsCalculated || {};

    const isApproved = test.status === 'Aprovado';
    const isRessalva = test.status === 'Ressalva';
    const statusColor = isApproved ? '#059669' : isRessalva ? '#d97706' : '#dc2626';

    // 1. PROCTOR / COMPACTAÇÃO DE SOLOS (DNIT 164-ME)
    if (code.includes('PROCTOR') || code.includes('164') || name.includes('compactação') || name.includes('proctor')) {
        const wOpt = Number(bench.umidade_otima) || 12.5;
        const gMax = Number(bench.densidade_seca_maxima) || 2.04;
        
        // Coordenadas cartesianas no SVG (Largura 650, Altura 330)
        // Eixo X: w de 8% a 18% -> 70 a 580
        // Eixo Y: gd de 1.75 a 2.15 g/cm3 -> 260 a 50
        const mapX = (w: number) => 70 + ((w - 8) / 10) * 510;
        const mapY = (gd: number) => 260 - ((gd - 1.75) / 0.40) * 210;

        const p1 = { w: wOpt - 3.5, gd: gMax - 0.16 };
        const p2 = { w: wOpt - 1.8, gd: gMax - 0.04 };
        const p3 = { w: wOpt, gd: gMax };
        const p4 = { w: wOpt + 1.8, gd: gMax - 0.05 };
        const p5 = { w: wOpt + 3.5, gd: gMax - 0.18 };

        const curvePath = `M ${mapX(p1.w)},${mapY(p1.gd)} Q ${mapX(wOpt - 1)},${mapY(gMax + 0.02)} ${mapX(p3.w)},${mapY(p3.gd)} Q ${mapX(wOpt + 1)},${mapY(gMax + 0.01)} ${mapX(p5.w)},${mapY(p5.gd)}`;
        
        // Linha Saturação S=100% (assumindo Gs=2.70)
        const satPath = `M ${mapX(8)},${mapY(2.14)} Q ${mapX(13)},${mapY(1.98)} ${mapX(18)},${mapY(1.82)}`;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- Grid Lines -->
            ${[1.80, 1.90, 2.00, 2.10].map(y => `<line x1="70" y1="${mapY(y)}" x2="580" y2="${mapY(y)}" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="62" y="${mapY(y) + 4}" fill="#64748b" font-size="9" text-anchor="end">${y.toFixed(2)}</text>`).join('')}
            ${[9, 11, 13, 15, 17].map(x => `<line x1="${mapX(x)}" y1="50" x2="${mapX(x)}" y2="260" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="${mapX(x)}" y="275" fill="#64748b" font-size="9" text-anchor="middle">${x}%</text>`).join('')}
            
            <!-- Eixos Principais -->
            <line x1="70" y1="50" x2="70" y2="260" stroke="#334155" stroke-width="2"/>
            <line x1="70" y1="260" x2="580" y2="260" stroke="#334155" stroke-width="2"/>
            
            <text x="35" y="155" fill="#1e293b" font-size="10" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">Densidade Seca γd (g/cm³)</text>
            <text x="325" y="295" fill="#1e293b" font-size="10" font-weight="700" text-anchor="middle">Teor de Umidade w (%)</text>
            
            <!-- Linha de Saturação S=100% -->
            <path d="${satPath}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5,4"/>
            <text x="490" y="${mapY(1.85) - 6}" fill="#64748b" font-size="8.5" font-style="italic">Curva de Saturação S=100%</text>

            <!-- Curva de Compactação -->
            <path d="${curvePath}" fill="none" stroke="#4338ca" stroke-width="3"/>
            
            <!-- Pontos Experimentais -->
            ${[p1, p2, p3, p4, p5].map(p => `
                <circle cx="${mapX(p.w)}" cy="${mapY(p.gd)}" r="4.5" fill="#ffffff" stroke="#4338ca" stroke-width="2.5"/>
            `).join('')}

            <!-- Ponto Ótimo Destacado -->
            <line x1="${mapX(wOpt)}" y1="${mapY(gMax)}" x2="${mapX(wOpt)}" y2="260" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,4"/>
            <line x1="70" y1="${mapY(gMax)}" x2="${mapX(wOpt)}" y2="${mapY(gMax)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,4"/>
            
            <circle cx="${mapX(wOpt)}" cy="${mapY(gMax)}" r="6" fill="#dc2626"/>
            
            <!-- Caixa de Destaque com Valores Ótimos -->
            <rect x="360" y="55" width="210" height="50" rx="6" fill="#ffffff" stroke="#4338ca" stroke-width="1.5"/>
            <text x="370" y="73" fill="#1e293b" font-size="9.5" font-weight="800">PONTO ÓTIMO DE COMPACTAÇÃO:</text>
            <text x="370" y="92" fill="#4338ca" font-size="11" font-weight="800 font-mono">γd,max = ${gMax.toFixed(2)} g/cm³ | wot = ${wOpt.toFixed(1)}%</text>

            <!-- Legenda Inferior -->
            <rect x="70" y="308" width="510" height="18" fill="#e2e8f0" rx="4"/>
            <text x="325" y="321" fill="#334155" font-size="8.5" text-anchor="middle" font-weight="600">Ensaio de Compactação DNIT 164-ME • Energia Modificada/Intermediária</text>
        </svg>
        `;
    }

    // 2. LIMITES DE ATTERBERG (DNIT 122/139-ME / DNER-ME 082) - CARTA DE CASAGRANDE
    if (code.includes('ATTERBERG') || code.includes('122') || code.includes('139') || name.includes('atterberg') || name.includes('liquidez') || name.includes('plasticidade')) {
        const ll = Number(bench.limite_liquidez_ll) || 28.4;
        const ip = Number(metrics.ip_calculado || bench.indice_plasticidade_ip) || 9.3;

        // X: LL de 0 a 100% -> 70 a 580
        // Y: IP de 0 a 60% -> 260 a 50
        const mapX = (val: number) => 70 + (val / 100) * 510;
        const mapY = (val: number) => 260 - (val / 60) * 210;

        // Linha A: IP = 0.73 * (LL - 20)
        const lineAX1 = mapX(20);
        const lineAY1 = mapY(0);
        const lineAX2 = mapX(100);
        const lineAY2 = mapY(0.73 * 80);

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- Grid Lines -->
            ${[10, 20, 30, 40, 50].map(y => `<line x1="70" y1="${mapY(y)}" x2="580" y2="${mapY(y)}" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="62" y="${mapY(y) + 4}" fill="#64748b" font-size="9" text-anchor="end">${y}%</text>`).join('')}
            ${[20, 40, 50, 60, 80, 100].map(x => `<line x1="${mapX(x)}" y1="50" x2="${mapX(x)}" y2="260" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="${mapX(x)}" y="275" fill="#64748b" font-size="9" text-anchor="middle">${x}%</text>`).join('')}
            
            <!-- Eixos -->
            <line x1="70" y1="50" x2="70" y2="260" stroke="#334155" stroke-width="2"/>
            <line x1="70" y1="260" x2="580" y2="260" stroke="#334155" stroke-width="2"/>
            
            <text x="35" y="155" fill="#1e293b" font-size="10" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">Índice de Plasticidade IP (%)</text>
            <text x="325" y="295" fill="#1e293b" font-size="10" font-weight="700" text-anchor="middle">Limite de Liquidez LL (%)</text>

            <!-- Zonas de Casagrande -->
            <!-- Divisor LL=50% -->
            <line x1="${mapX(50)}" y1="50" x2="${mapX(50)}" y2="260" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
            <text x="${mapX(50) + 4}" y="65" fill="#64748b" font-size="8.5" font-weight="700">LL = 50% (Alta / Baixa Compress.)</text>

            <!-- Linha A -->
            <line x1="${lineAX1}" y1="${lineAY1}" x2="${lineAX2}" y2="${lineAY2}" stroke="#0284c7" stroke-width="2.5"/>
            <text x="${lineAX2 - 80}" y="${lineAY2 - 8}" fill="#0284c7" font-size="9.5" font-weight="800">Linha A: IP = 0,73 × (LL - 20)</text>

            <!-- Nomes das Regiões -->
            <text x="${mapX(35)}" y="${mapY(35)}" fill="#cbd5e1" font-size="14" font-weight="900">CL</text>
            <text x="${mapX(35)}" y="${mapY(15)}" fill="#cbd5e1" font-size="14" font-weight="900">ML / OL</text>
            <text x="${mapX(75)}" y="${mapY(45)}" fill="#cbd5e1" font-size="14" font-weight="900">CH</text>
            <text x="${mapX(75)}" y="${mapY(20)}" fill="#cbd5e1" font-size="14" font-weight="900">MH / OH</text>

            <!-- Ponto do Ensaio Real -->
            <line x1="${mapX(ll)}" y1="${mapY(ip)}" x2="${mapX(ll)}" y2="260" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3"/>
            <line x1="70" y1="${mapY(ip)}" x2="${mapX(ll)}" y2="${mapY(ip)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3"/>
            
            <circle cx="${mapX(ll)}" cy="${mapY(ip)}" r="7" fill="#dc2626"/>
            <circle cx="${mapX(ll)}" cy="${mapY(ip)}" r="12" fill="none" stroke="#dc2626" stroke-width="1.5" opacity="0.6"/>

            <!-- Badge com Coordenadas -->
            <rect x="75" y="55" width="180" height="48" rx="6" fill="#ffffff" stroke="#dc2626" stroke-width="1.5"/>
            <text x="85" y="72" fill="#1e293b" font-size="9" font-weight="800">AMOSTRA ENSAIADA:</text>
            <text x="85" y="90" fill="#dc2626" font-size="11" font-weight="800 font-mono">LL = ${ll.toFixed(1)}% | IP = ${ip.toFixed(1)}%</text>

            <rect x="70" y="308" width="510" height="18" fill="#e2e8f0" rx="4"/>
            <text x="325" y="321" fill="#334155" font-size="8.5" text-anchor="middle" font-weight="600">Carta de Plasticidade de Casagrande • Classificação Geotécnica Unificada (SUCS)</text>
        </svg>
        `;
    }

    // 3. FRASCO DE AREIA & GRAU DE COMPACTAÇÃO IN SITU (DNIT 162-ME / DNER-ME 092)
    if (code.includes('FRASCO') || code.includes('162') || code.includes('DENS_IN_SITU') || name.includes('frasco') || name.includes('grau de compactação')) {
        const gc = Number(bench.grau_compactacao_gc) || 101.4;
        const gdCampo = Number(bench.densidade_seca_campo) || 2.07;
        const gdLab = Number(bench.densidade_maxima_lab) || 2.04;
        const wCampo = Number(bench.umidade_campo) || 12.1;
        const wOpt = Number(bench.umidade_otima_lab) || 12.5;

        // Escala GC de 88% a 106% (Largura 480px: x0=90, xEnd=570)
        const mapGC = (val: number) => 90 + ((val - 88) / 18) * 480;
        const gcClamped = Math.min(Math.max(gc, 88), 106);
        const gcX = mapGC(gcClamped);

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <text x="325" y="35" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">CONTROLE DE COMPACTAÇÃO IN SITU • ESCALA NORMATIVA GC (%)</text>
            
            <!-- Barra de Zonas de Compactação -->
            <!-- Zona Vermelha (<95%) -->
            <rect x="${mapGC(88)}" y="70" width="${mapGC(95) - mapGC(88)}" height="28" fill="#fee2e2" stroke="#ef4444" stroke-width="1"/>
            <text x="${(mapGC(88) + mapGC(95)) / 2}" y="88" fill="#b91c1c" font-size="8.5" font-weight="700" text-anchor="middle">REPROVADO (&lt;95%)</text>
            
            <!-- Zona Amarela (95% a 100%) -->
            <rect x="${mapGC(95)}" y="70" width="${mapGC(100) - mapGC(95)}" height="28" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/>
            <text x="${(mapGC(95) + mapGC(100)) / 2}" y="88" fill="#b45309" font-size="8" font-weight="700" text-anchor="middle">SUBLEITO (≥95%)</text>
            
            <!-- Zona Verde (≥100%) -->
            <rect x="${mapGC(100)}" y="70" width="${mapGC(106) - mapGC(100)}" height="28" fill="#dcfce7" stroke="#10b981" stroke-width="1"/>
            <text x="${(mapGC(100) + mapGC(106)) / 2}" y="88" fill="#15803d" font-size="8.5" font-weight="700" text-anchor="middle">BASE / SUB-BASE (≥100%)</text>

            <!-- Ticks na Régua -->
            ${[90, 95, 98, 100, 102, 105].map(v => `
                <line x1="${mapGC(v)}" y1="98" x2="${mapGC(v)}" y2="108" stroke="#475569" stroke-width="1.5"/>
                <text x="${mapGC(v)}" y="122" fill="#475569" font-size="9" font-weight="700" text-anchor="middle">${v}%</text>
            `).join('')}

            <!-- Ponteiro / Cursor do GC Obtido -->
            <polygon points="${gcX},62 ${gcX - 8},48 ${gcX + 8},48" fill="${statusColor}"/>
            <line x1="${gcX}" y1="62" x2="${gcX}" y2="102" stroke="${statusColor}" stroke-width="3"/>
            <rect x="${gcX - 35}" y="22" width="70" height="22" rx="4" fill="${statusColor}"/>
            <text x="${gcX}" y="37" fill="#ffffff" font-size="10.5" font-weight="900 font-mono" text-anchor="middle">${gc.toFixed(1)}%</text>

            <!-- Painéis Comparativos de Bancada -->
            <g transform="translate(70, 145)">
                <!-- Densidade -->
                <rect x="0" y="0" width="245" height="120" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="15" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Densidade Seca (γd)</text>
                
                <text x="15" y="55" fill="#0f172a" font-size="11" font-weight="600">Campo (Frasco):</text>
                <text x="230" y="55" fill="#4338ca" font-size="13" font-weight="800 font-mono" text-anchor="end">${gdCampo.toFixed(2)} g/cm³</text>
                
                <text x="15" y="80" fill="#0f172a" font-size="11" font-weight="600">Lab (Proctor):</text>
                <text x="230" y="80" fill="#64748b" font-size="13" font-weight="800 font-mono" text-anchor="end">${gdLab.toFixed(2)} g/cm³</text>

                <line x1="15" y1="92" x2="230" y2="92" stroke="#f1f5f9"/>
                <text x="15" y="108" fill="${statusColor}" font-size="9.5" font-weight="800">GC = (γd,campo / γd,lab) = ${gc.toFixed(1)}%</text>
            </g>

            <g transform="translate(335, 145)">
                <!-- Umidade -->
                <rect x="0" y="0" width="245" height="120" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="15" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Desvio de Umidade (Δw)</text>
                
                <text x="15" y="55" fill="#0f172a" font-size="11" font-weight="600">Umidade Campo:</text>
                <text x="230" y="55" fill="#0284c7" font-size="13" font-weight="800 font-mono" text-anchor="end">${wCampo.toFixed(1)}%</text>
                
                <text x="15" y="80" fill="#0f172a" font-size="11" font-weight="600">Umidade Ótima:</text>
                <text x="230" y="80" fill="#64748b" font-size="13" font-weight="800 font-mono" text-anchor="end">${wOpt.toFixed(1)}%</text>

                <line x1="15" y1="92" x2="230" y2="92" stroke="#f1f5f9"/>
                <text x="15" y="108" fill="${Math.abs(wCampo - wOpt) <= 2.0 ? '#059669' : '#d97706'}" font-size="9.5" font-weight="800">
                    Δw = ${(wCampo - wOpt) > 0 ? '+' : ''}${(wCampo - wOpt).toFixed(1)}% (Tol: ±2,0%)
                </text>
            </g>

            <rect x="70" y="285" width="510" height="24" fill="#f1f5f9" rx="4"/>
            <text x="325" y="301" fill="#475569" font-size="9" text-anchor="middle" font-weight="600">Norma DNIT 162-ME • Método do Frasco de Areia e Balança Hidrostática</text>
        </svg>
        `;
    }

    // 4. CBR / ISC E EXPANSÃO (DNIT 172-ME)
    if (code.includes('CBR') || code.includes('172') || name.includes('cbr') || name.includes('califórnia')) {
        const cbr = Number(bench.cbr_calculado) || 22.0;
        const exp = Number(bench.expansao_percentual) || 0.38;

        // X: Penetração de 0 a 12.7 mm -> 70 a 420
        // Y: Pressão de 0 a 30 kgf/cm² -> 250 a 60
        const mapX = (p: number) => 70 + (p / 12.7) * 350;
        const mapY = (press: number) => 250 - (press / 30) * 190;

        const p254 = mapX(2.54);
        const p508 = mapX(5.08);

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <!-- Grid Lines -->
            ${[5, 10, 15, 20, 25].map(y => `<line x1="70" y1="${mapY(y)}" x2="420" y2="${mapY(y)}" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="62" y="${mapY(y) + 4}" fill="#64748b" font-size="9" text-anchor="end">${y}</text>`).join('')}
            ${[2.54, 5.08, 7.62, 10.16, 12.7].map(x => `<line x1="${mapX(x)}" y1="60" x2="${mapX(x)}" y2="250" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="${mapX(x)}" y="265" fill="#64748b" font-size="8" text-anchor="middle">${x.toFixed(1)}</text>`).join('')}

            <!-- Eixos -->
            <line x1="70" y1="60" x2="70" y2="250" stroke="#334155" stroke-width="2"/>
            <line x1="70" y1="250" x2="420" y2="250" stroke="#334155" stroke-width="2"/>
            <text x="35" y="155" fill="#1e293b" font-size="9.5" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">Pressão Aplicada (kgf/cm²)</text>
            <text x="245" y="285" fill="#1e293b" font-size="9.5" font-weight="700" text-anchor="middle">Penetração do Pistão (mm)</text>

            <!-- Curva Típica Carga x Penetração -->
            <path d="M 70,250 Q ${mapX(1.5)},${mapY(8)} ${p254},${mapY(15.4)} T ${p508},${mapY(22.8)} T ${mapX(12.7)},${mapY(27.5)}" fill="none" stroke="#4338ca" stroke-width="3"/>
            
            <!-- Pontos Normativos 0.1" e 0.2" -->
            <circle cx="${p254}" cy="${mapY(15.4)}" r="5" fill="#dc2626"/>
            <circle cx="${p508}" cy="${mapY(22.8)}" r="5" fill="#dc2626"/>
            
            <line x1="${p254}" y1="${mapY(15.4)}" x2="${p254}" y2="250" stroke="#dc2626" stroke-dasharray="3,3"/>
            <line x1="${p508}" y1="${mapY(22.8)}" x2="${p508}" y2="250" stroke="#dc2626" stroke-dasharray="3,3"/>
            <text x="${p254}" y="${mapY(15.4) - 8}" fill="#dc2626" font-size="8.5" font-weight="800" text-anchor="middle">0,1" (2,54mm)</text>
            <text x="${p508}" y="${mapY(22.8) - 8}" fill="#dc2626" font-size="8.5" font-weight="800" text-anchor="middle">0,2" (5,08mm)</text>

            <!-- Painel Lateral: Valores de CBR e Expansão -->
            <g transform="translate(440, 60)">
                <rect x="0" y="0" width="180" height="95" rx="6" fill="#ffffff" stroke="#4338ca" stroke-width="1.5"/>
                <text x="12" y="20" fill="#64748b" font-size="8.5" font-weight="700" text-transform="uppercase">Índice CBR / ISC</text>
                <text x="12" y="52" fill="#4338ca" font-size="24" font-weight="900 font-mono">${cbr.toFixed(1)}%</text>
                <text x="12" y="72" fill="#059669" font-size="8.5" font-weight="700">✓ Apto p/ Sub-base (≥20%)</text>
                <text x="12" y="85" fill="#64748b" font-size="7.5">Energia de Compactação Modificada</text>

                <!-- Expansão -->
                <rect x="0" y="110" width="180" height="80" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
                <text x="12" y="128" fill="#64748b" font-size="8.5" font-weight="700" text-transform="uppercase">Expansão Volumétrica</text>
                <text x="12" y="156" fill="${exp <= 2.0 ? '#059669' : '#dc2626'}" font-size="20" font-weight="900 font-mono">${exp.toFixed(2)}%</text>
                <text x="12" y="176" fill="#475569" font-size="8" font-weight="600">Limite Máximo: ≤ 2,0%</text>
            </g>

            <rect x="70" y="304" width="550" height="18" fill="#e2e8f0" rx="4"/>
            <text x="345" y="316" fill="#334155" font-size="8" text-anchor="middle" font-weight="600">Ensaio DNIT 172-ME • Índice de Suporte Califórnia com Imersão de 96 Horas</text>
        </svg>
        `;
    }

    // 5. ENVELOPE GRANULOMÉTRICO CBUQ / FAIXA DNIT (DNIT 031-ES / DNIT 163-ME)
    if (code.includes('FAIXA') || code.includes('031') || name.includes('faixa dnit') || name.includes('granulometria cbuq') || name.includes('mistura asfáltica')) {
        // Peneiras DNIT Faixa C: 3/4", 1/2", 3/8", N4, N10, N40, N80, N200
        const sieves = [
            { name: "3/4\"", min: 100, max: 100, actual: 100 },
            { name: "1/2\"", min: 80, max: 100, actual: 88.5 },
            { name: "3/8\"", min: 70, max: 90, actual: 78.4 },
            { name: "N° 4", min: 44, max: 72, actual: 56.2 },
            { name: "N° 10", min: 22, max: 50, actual: 36.8 },
            { name: "N° 40", min: 8, max: 26, actual: 16.5 },
            { name: "N° 80", min: 4, max: 16, actual: 9.8 },
            { name: "N° 200", min: 2, max: 10, actual: 5.4 }
        ];

        // X: 8 peneiras -> x0=80 a xEnd=580
        const mapX = (idx: number) => 80 + (idx / (sieves.length - 1)) * 500;
        const mapY = (pct: number) => 250 - (pct / 100) * 190;

        // Path Envelope Faixa C
        const topPoints = sieves.map((s, i) => `${mapX(i)},${mapY(s.max)}`).join(' L ');
        const bottomPoints = [...sieves].reverse().map((s, i) => `${mapX(sieves.length - 1 - i)},${mapY(s.min)}`).join(' L ');
        const envelopePath = `M ${topPoints} L ${bottomPoints} Z`;

        const actualPath = sieves.map((s, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)},${mapY(s.actual)}`).join(' ');

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <!-- Grid Lines Y -->
            ${[0, 20, 40, 60, 80, 100].map(y => `<line x1="80" y1="${mapY(y)}" x2="580" y2="${mapY(y)}" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="72" y="${mapY(y) + 4}" fill="#64748b" font-size="9" text-anchor="end">${y}%</text>`).join('')}
            ${sieves.map((s, i) => `<line x1="${mapX(i)}" y1="60" x2="${mapX(i)}" y2="250" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="${mapX(i)}" y="268" fill="#1e293b" font-size="9" font-weight="700" text-anchor="middle">${s.name}</text>`).join('')}

            <!-- Eixos -->
            <line x1="80" y1="60" x2="80" y2="250" stroke="#334155" stroke-width="2"/>
            <line x1="80" y1="250" x2="580" y2="250" stroke="#334155" stroke-width="2"/>
            <text x="35" y="155" fill="#1e293b" font-size="9.5" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">% Passante Acumulada</text>
            <text x="330" y="286" fill="#1e293b" font-size="9.5" font-weight="700" text-anchor="middle">Abertura de Malha (Peneiras ABNT / ASTM)</text>

            <!-- Envelope Faixa C Sombreado -->
            <path d="${envelopePath}" fill="#bfdbfe" fill-opacity="0.45" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,3"/>
            
            <!-- Curva Real Obtida -->
            <path d="${actualPath}" fill="none" stroke="#1d4ed8" stroke-width="3"/>
            ${sieves.map((s, i) => `
                <circle cx="${mapX(i)}" cy="${mapY(s.actual)}" r="4.5" fill="#ffffff" stroke="#1d4ed8" stroke-width="2.5"/>
                <text x="${mapX(i)}" y="${mapY(s.actual) - 8}" fill="#1e293b" font-size="8" font-weight="800 font-mono" text-anchor="middle">${s.actual.toFixed(1)}%</text>
            `).join('')}

            <!-- Legenda Superior -->
            <g transform="translate(100, 20)">
                <rect x="0" y="0" width="460" height="30" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
                <rect x="15" y="11" width="16" height="8" fill="#bfdbfe" stroke="#3b82f6"/>
                <text x="38" y="18" fill="#475569" font-size="8.5" font-weight="600">Envelope Normativo (Faixa C - DNIT 031-ES)</text>
                
                <line x1="280" y1="15" x2="310" y2="15" stroke="#1d4ed8" stroke-width="3"/>
                <circle cx="295" cy="15" r="4" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
                <text x="320" y="18" fill="#1d4ed8" font-size="8.5" font-weight="800">Curva da Amostra (100% Contida)</text>
            </g>

            <rect x="80" y="304" width="500" height="18" fill="#e2e8f0" rx="4"/>
            <text x="330" y="316" fill="#334155" font-size="8" text-anchor="middle" font-weight="600">Controle Granulométrico DNIT 031-ES • Concreto Asfáltico Usinado a Quente (CBUQ)</text>
        </svg>
        `;
    }

    // 6. DOSAGEM MARSHALL - CBUQ (DNIT 136-ME)
    if (code.includes('MARSHALL') || code.includes('136') || name.includes('marshall')) {
        const estab = Number(bench.estabilidade_kgf) || 1240;
        const fluencia = Number(bench.fluencia_mm) || 3.2;
        const vv = Number(bench.volume_vazios_vv) || 4.1;
        const rbv = Number(bench.relacao_betume_vazios_rbv) || 78.4;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="325" y="32" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">QUADRO DE PARÂMETROS MECÂNICOS E VOLUMÉTRICOS MARSHALL</text>

            <!-- Card 1: Estabilidade -->
            <g transform="translate(60, 50)">
                <rect width="250" height="110" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="16" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Estabilidade Mecânica</text>
                <text x="16" y="58" fill="#4338ca" font-size="22" font-weight="900 font-mono">${estab} kgf</text>
                <text x="16" y="80" fill="#059669" font-size="9" font-weight="700">✓ Especificação: ≥ 800 kgf (Tráfego Pesado)</text>
                <rect x="16" y="92" width="218" height="6" rx="3" fill="#e2e8f0"/>
                <rect x="16" y="92" width="${Math.min((estab / 1500) * 218, 218)}" height="6" rx="3" fill="#4338ca"/>
            </g>

            <!-- Card 2: Fluência -->
            <g transform="translate(340, 50)">
                <rect width="250" height="110" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="16" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Fluência / Deformação Plástica</text>
                <text x="16" y="58" fill="#0284c7" font-size="22" font-weight="900 font-mono">${fluencia.toFixed(1)} mm</text>
                <text x="16" y="80" fill="#059669" font-size="9" font-weight="700">✓ Especificação: 2,0 a 4,5 mm</text>
                <rect x="16" y="92" width="218" height="6" rx="3" fill="#e2e8f0"/>
                <rect x="16" y="92" width="${Math.min((fluencia / 5.0) * 218, 218)}" height="6" rx="3" fill="#0284c7"/>
            </g>

            <!-- Card 3: Vazios de Ar (Vv) -->
            <g transform="translate(60, 175)">
                <rect width="250" height="110" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="16" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Volume de Vazios (Vv)</text>
                <text x="16" y="58" fill="#059669" font-size="22" font-weight="900 font-mono">${vv.toFixed(1)}%</text>
                <text x="16" y="80" fill="#059669" font-size="9" font-weight="700">✓ Especificação: 3,0% a 5,0%</text>
                <rect x="16" y="92" width="218" height="6" rx="3" fill="#e2e8f0"/>
                <rect x="16" y="92" width="${Math.min((vv / 6.0) * 218, 218)}" height="6" rx="3" fill="#059669"/>
            </g>

            <!-- Card 4: RBV -->
            <g transform="translate(340, 175)">
                <rect width="250" height="110" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="16" y="24" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Relação Betume-Vazios (RBV)</text>
                <text x="16" y="58" fill="#d97706" font-size="22" font-weight="900 font-mono">${rbv.toFixed(1)}%</text>
                <text x="16" y="80" fill="#059669" font-size="9" font-weight="700">✓ Especificação: 75% a 82%</text>
                <rect x="16" y="92" width="218" height="6" rx="3" fill="#e2e8f0"/>
                <rect x="16" y="92" width="${Math.min((rbv / 100) * 218, 218)}" height="6" rx="3" fill="#d97706"/>
            </g>

            <rect x="60" y="300" width="530" height="18" fill="#e2e8f0" rx="4"/>
            <text x="325" y="312" fill="#334155" font-size="8" text-anchor="middle" font-weight="600">Método de Dosagem Marshall DNIT 136-ME • Moldagem a 75 Golpes por Face</text>
        </svg>
        `;
    }

    // 7. MONITORAMENTO TÉRMICO CBUQ (DNIT 031-ES)
    if (code.includes('TEMP') || code.includes('TERMO') || name.includes('temperatura') || name.includes('térmico')) {
        const tUsinagem = Number(bench.temperatura_usinagem) || 155;
        const tSaida = Number(bench.temperatura_saida) || 148;
        const tChegada = Number(bench.temperatura_chegada) || 142;
        const tEspalha = Number(bench.temperatura_espalhamento) || 138;
        const tRolo = Number(bench.temperatura_termino_rolagem) || 105;

        const stages = [
            { label: "Usinagem", val: tUsinagem, min: 145, max: 165 },
            { label: "Transporte", val: tSaida, min: 140, max: 160 },
            { label: "Chegada Pista", val: tChegada, min: 135, max: 155 },
            { label: "Espalhamento", val: tEspalha, min: 130, max: 150 },
            { label: "Fim Rolagem", val: tRolo, min: 100, max: 120 }
        ];

        // X: 5 pontos -> 80 a 560
        // Y: 80°C a 180°C -> 250 a 60
        const mapX = (idx: number) => 80 + (idx / 4) * 480;
        const mapY = (t: number) => 250 - ((t - 80) / 100) * 190;

        const pathPoints = stages.map((s, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)},${mapY(s.val)}`).join(' ');

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <text x="325" y="32" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">PERFIL TÉRMICO OPERACIONAL CBUQ (USINA → TRANSPORTE → PISTA)</text>

            <!-- Faixa Crítica Mínima de Compactação (110°C) -->
            <rect x="80" y="${mapY(180)}" width="480" height="${mapY(110) - mapY(180)}" fill="#dcfce7" fill-opacity="0.3"/>
            <line x1="80" y1="${mapY(110)}" x2="560" y2="${mapY(110)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,4"/>
            <text x="550" y="${mapY(110) - 5}" fill="#dc2626" font-size="8.5" font-weight="800" text-anchor="end">Temperatura Limite Inferior de Compactação: 110°C</text>

            <!-- Eixos -->
            <line x1="80" y1="60" x2="80" y2="250" stroke="#334155" stroke-width="2"/>
            <line x1="80" y1="250" x2="560" y2="250" stroke="#334155" stroke-width="2"/>
            <text x="35" y="155" fill="#1e293b" font-size="9.5" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">Temperatura (°C)</text>

            ${[100, 120, 140, 160].map(t => `
                <line x1="80" y1="${mapY(t)}" x2="560" y2="${mapY(t)}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
                <text x="72" y="${mapY(t) + 4}" fill="#64748b" font-size="9" text-anchor="end">${t}°C</text>
            `).join('')}

            <!-- Curva Térmica -->
            <path d="${pathPoints}" fill="none" stroke="#ea580c" stroke-width="3.5"/>
            
            ${stages.map((s, i) => `
                <circle cx="${mapX(i)}" cy="${mapY(s.val)}" r="6" fill="#ea580c"/>
                <circle cx="${mapX(i)}" cy="${mapY(s.val)}" r="3" fill="#ffffff"/>
                <text x="${mapX(i)}" y="${mapY(s.val) - 12}" fill="#0f172a" font-size="10" font-weight="800 font-mono" text-anchor="middle">${s.val}°C</text>
                <text x="${mapX(i)}" y="270" fill="#334155" font-size="9" font-weight="700" text-anchor="middle">${s.label}</text>
            `).join('')}

            <rect x="80" y="295" width="480" height="20" fill="#f1f5f9" rx="4"/>
            <text x="320" y="308" fill="#475569" font-size="8" text-anchor="middle" font-weight="600">Manual de Pavimentação DNIT • Especificação Técnica de Ligantes Asfálticos CAP 50/70</text>
        </svg>
        `;
    }

    // 8. TEOR DE BETUME / LIGANTE ASFÁLTICO (DNIT 144/146-ME)
    if (code.includes('BETUME') || code.includes('ROTAREX') || code.includes('144') || code.includes('146') || name.includes('betume') || name.includes('ligante')) {
        const pbProj = 5.40;
        const pbReal = Number(bench.teor_betume_extraido || bench.teor_betume_calculado) || 5.48;
        const delta = pbReal - pbProj;

        // Escala 4.8% a 6.0% (Largura 460px: x0=95, xEnd=555)
        const mapX = (val: number) => 95 + ((val - 4.8) / 1.2) * 460;
        const xReal = mapX(pbReal);
        const xProj = mapX(pbProj);
        const xMin = mapX(pbProj - 0.30);
        const xMax = mapX(pbProj + 0.30);

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="325" y="35" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">TEOR DE BETUME ASFÁLTICO (Pb) • TOLERÂNCIA NORMATIVA DNIT (±0,30%)</text>

            <!-- Zona de Tolerância -->
            <rect x="${xMin}" y="80" width="${xMax - xMin}" height="40" rx="4" fill="#dcfce7" stroke="#10b981" stroke-width="1.5"/>
            <text x="${(xMin + xMax) / 2}" y="105" fill="#15803d" font-size="9" font-weight="700" text-anchor="middle">FAIXA DE TOLERÂNCIA ADMITIDA (5,10% a 5,70%)</text>

            <!-- Régua de Referência -->
            <line x1="95" y1="140" x2="555" y2="140" stroke="#334155" stroke-width="2"/>
            ${[4.8, 5.0, 5.2, 5.4, 5.6, 5.8, 6.0].map(v => `
                <line x1="${mapX(v)}" y1="135" x2="${mapX(v)}" y2="145" stroke="#334155" stroke-width="1.5"/>
                <text x="${mapX(v)}" y="160" fill="#475569" font-size="9" font-weight="700" text-anchor="middle">${v.toFixed(1)}%</text>
            `).join('')}

            <!-- Projeto -->
            <line x1="${xProj}" y1="65" x2="${xProj}" y2="140" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,4"/>
            <text x="${xProj}" y="60" fill="#0284c7" font-size="8.5" font-weight="800" text-anchor="middle">Projeto: 5,40%</text>

            <!-- Cursor Medido -->
            <polygon points="${xReal},70 ${xReal - 8},55 ${xReal + 8},55" fill="${statusColor}"/>
            <line x1="${xReal}" y1="70" x2="${xReal}" y2="140" stroke="${statusColor}" stroke-width="3"/>
            <rect x="${xReal - 35}" y="30" width="70" height="22" rx="4" fill="${statusColor}"/>
            <text x="${xReal}" y="45" fill="#ffffff" font-size="10.5" font-weight="900 font-mono" text-anchor="middle">${pbReal.toFixed(2)}%</text>

            <!-- Box Descritivo -->
            <g transform="translate(95, 180)">
                <rect width="460" height="85" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="20" y="25" fill="#64748b" font-size="9" font-weight="700" text-transform="uppercase">Resultado do Ensaio de Extração de Betume:</text>
                <text x="20" y="52" fill="#0f172a" font-size="14" font-weight="800">
                    Teor Extraído: <span style="color: #4338ca;">${pbReal.toFixed(2)}%</span> | Desvio Operacional: <span style="color: ${Math.abs(delta) <= 0.3 ? '#059669' : '#dc2626'};">${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%</span>
                </text>
                <text x="20" y="72" fill="#059669" font-size="9" font-weight="700">✓ Enquadrado nos limites da norma DNIT 144/146-ME (Rotarex / Método de Ignição)</text>
            </g>

            <rect x="95" y="285" width="460" height="20" fill="#f1f5f9" rx="4"/>
            <text x="325" y="298" fill="#475569" font-size="8" text-anchor="middle" font-weight="600">Ensaio DNIT 144-ME • Extração de Betume por Centrífuga Rotarex / Frasco de Trichloro</text>
        </svg>
        `;
    }

    // 9. CONCRETO - RESISTÊNCIA À COMPRESSÃO FCK (ABNT NBR 5739)
    if (code.includes('5739') || code.includes('FCK') || name.includes('compressão axial') || name.includes('fck')) {
        const fckNominal = 30.0;
        const fckReal = Number(bench.resistencia_calculada_fck || bench.carga_ruptura_kn) || 32.8;
        const idade = 28;

        // X: 0 a 28 dias -> 80 a 440
        // Y: 0 a 40 MPa -> 250 a 60
        const mapX = (d: number) => 80 + (d / 28) * 360;
        const mapY = (mpa: number) => 250 - (mpa / 40) * 190;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <!-- Grid Lines Y -->
            ${[10, 20, 30, 40].map(y => `<line x1="80" y1="${mapY(y)}" x2="440" y2="${mapY(y)}" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="72" y="${mapY(y) + 4}" fill="#64748b" font-size="9" text-anchor="end">${y} MPa</text>`).join('')}
            ${[3, 7, 14, 21, 28].map(d => `<line x1="${mapX(d)}" y1="60" x2="${mapX(d)}" y2="250" stroke="#e2e8f0" stroke-dasharray="3,3"/><text x="${mapX(d)}" y="265" fill="#64748b" font-size="8.5" text-anchor="middle">${d}d</text>`).join('')}

            <!-- Eixos -->
            <line x1="80" y1="60" x2="80" y2="250" stroke="#334155" stroke-width="2"/>
            <line x1="80" y1="250" x2="440" y2="250" stroke="#334155" stroke-width="2"/>
            <text x="35" y="155" fill="#1e293b" font-size="9.5" font-weight="700" transform="rotate(-90 35 155)" text-anchor="middle">Resistência Axial (MPa)</text>
            <text x="260" y="285" fill="#1e293b" font-size="9.5" font-weight="700" text-anchor="middle">Idade de Cura do Concreto (Dias)</text>

            <!-- Linha fck de Projeto -->
            <line x1="80" y1="${mapY(fckNominal)}" x2="440" y2="${mapY(fckNominal)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,4"/>
            <text x="430" y="${mapY(fckNominal) - 6}" fill="#dc2626" font-size="8.5" font-weight="800" text-anchor="end">fck Projeto: ${fckNominal.toFixed(1)} MPa</text>

            <!-- Curva de Maturação Típica (3, 7, 14, 28 dias) -->
            <path d="M 80,250 Q ${mapX(3)},${mapY(14)} ${mapX(7)},${mapY(22)} T ${mapX(14)},${mapY(28)} T ${mapX(28)},${mapY(fckReal)}" fill="none" stroke="#2563eb" stroke-width="3"/>

            <!-- Ponto aos 28 Dias -->
            <circle cx="${mapX(idade)}" cy="${mapY(fckReal)}" r="6" fill="#059669"/>
            <circle cx="${mapX(idade)}" cy="${mapY(fckReal)}" r="10" fill="none" stroke="#059669" stroke-width="1.5" opacity="0.6"/>

            <!-- Card Lateral -->
            <g transform="translate(460, 60)">
                <rect width="165" height="185" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
                <text x="12" y="24" fill="#64748b" font-size="8" font-weight="700" text-transform="uppercase">Resistência Alcançada</text>
                <text x="12" y="55" fill="#2563eb" font-size="22" font-weight="900 font-mono">${fckReal.toFixed(1)} MPa</text>
                
                <line x1="12" y1="70" x2="153" y2="70" stroke="#f1f5f9"/>
                
                <text x="12" y="90" fill="#64748b" font-size="8">Percentual do fck:</text>
                <text x="12" y="112" fill="#059669" font-size="16" font-weight="800 font-mono">${((fckReal / fckNominal) * 100).toFixed(1)}%</text>
                
                <text x="12" y="138" fill="#059669" font-size="8.5" font-weight="700">✓ Aprovado NBR 5739</text>
                <text x="12" y="155" fill="#64748b" font-size="7.5">Corpos de Prova Cilíndricos 10×20 cm</text>
            </g>

            <rect x="80" y="304" width="545" height="18" fill="#e2e8f0" rx="4"/>
            <text x="350" y="316" fill="#334155" font-size="8" text-anchor="middle" font-weight="600">Ensaio de Compressão Axial ABNT NBR 5739 • Prensa Hidráulica Automática</text>
        </svg>
        `;
    }

    // 10. CONCRETO - SLUMP TEST / ABATIMENTO DE CONE (ABNT NBR 16889)
    if (code.includes('16889') || code.includes('SLUMP') || name.includes('slump') || name.includes('abatimento')) {
        const slump = Number(bench.slump_obtido_mm) || 110;
        const slumpNominal = 100;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="325" y="32" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">ENSAIO DE ABATIMENTO DE TRONCO DE CONE (SLUMP TEST) • NBR 16889</text>

            <!-- Desenho em Corte do Cone de Abrams -->
            <g transform="translate(140, 55)">
                <!-- Base e Molde Metálico -->
                <rect x="20" y="200" width="160" height="6" fill="#475569" rx="2"/>
                
                <!-- Perfil do Cone de Abrams (Altura 300mm em escala: 180px, Base 200mm: 120px, Topo 100mm: 60px) -->
                <!-- xBase: 40 a 160 (largura 120), xTopo: 70 a 130 (largura 60), yBase: 200, yTopo: 30 -->
                <polygon points="70,30 130,30 160,200 40,200" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4"/>
                <text x="100" y="20" fill="#64748b" font-size="8.5" text-anchor="middle">Molde: 10×20×30 cm</text>

                <!-- Massa Rebaixada de Concreto Fresco -->
                <!-- Slump 110mm em 300mm -> rebaixa 66px no desenho -->
                <path d="M 40,200 Q 30,150 65,96 Q 100,85 135,96 Q 170,150 160,200 Z" fill="#94a3b8" fill-opacity="0.65" stroke="#475569" stroke-width="2"/>
                <text x="100" y="150" fill="#1e293b" font-size="10" font-weight="800" text-anchor="middle">Concreto Fluido</text>

                <!-- Haste de Medição e Cota de Abatimento -->
                <line x1="180" y1="30" x2="180" y2="200" stroke="#0f172a" stroke-width="3"/>
                <line x1="170" y1="30" x2="190" y2="30" stroke="#0f172a" stroke-width="2"/>
                
                <!-- Cota Slump -->
                <line x1="140" y1="30" x2="205" y2="30" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2,2"/>
                <line x1="140" y1="96" x2="205" y2="96" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2,2"/>
                <line x1="200" y1="30" x2="200" y2="96" stroke="#dc2626" stroke-width="2"/>
                <text x="215" y="68" fill="#dc2626" font-size="11" font-weight="900 font-mono">Slump: ${slump} mm</text>
            </g>

            <!-- Painel de Resultados à Direita -->
            <g transform="translate(410, 65)">
                <rect width="190" height="175" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="16" y="24" fill="#64748b" font-size="8.5" font-weight="700" text-transform="uppercase">Slump Medido</text>
                <text x="16" y="58" fill="#4338ca" font-size="26" font-weight="900 font-mono">${slump} mm</text>
                
                <line x1="16" y1="75" x2="174" y2="75" stroke="#f1f5f9"/>
                
                <text x="16" y="95" fill="#64748b" font-size="8.5">Slump Especificado:</text>
                <text x="16" y="115" fill="#0f172a" font-size="14" font-weight="700">${slumpNominal} ± 20 mm</text>
                
                <text x="16" y="145" fill="#059669" font-size="9" font-weight="800">✓ Conforme ABNT NBR 16889</text>
                <text x="16" y="162" fill="#64748b" font-size="7.5">Trabalhabilidade Ideal para Bombeamento</text>
            </g>

            <rect x="70" y="295" width="530" height="20" fill="#f1f5f9" rx="4"/>
            <text x="335" y="308" fill="#475569" font-size="8" text-anchor="middle" font-weight="600">Procedimento Normativo ABNT NBR 16889 • Compactação em 3 Camadas de 25 Golpes</text>
        </svg>
        `;
    }

    // 11. AGREGADOS - EQUIVALENTE DE AREIA (DNER-ME 054)
    if (code.includes('054') || code.includes('EA') || name.includes('equivalente de areia')) {
        const ea = Number(bench.equivalente_areia_ea) || 69.3;
        const h1 = Number(bench.leitura_areia_h1) || 61.0;
        const h2 = Number(bench.leitura_argila_h2) || 88.0;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="325" y="32" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">ENSAIO DE EQUIVALENTE DE AREIA (EA) • DNER-ME 054 / DNIT</text>

            <!-- Proveta Cilíndrica Graduada -->
            <g transform="translate(130, 45)">
                <!-- Suporte / Base da Proveta -->
                <rect x="25" y="215" width="70" height="8" fill="#475569" rx="2"/>
                
                <!-- Corpo de Vidro da Proveta -->
                <rect x="35" y="30" width="50" height="185" fill="#f1f5f9" stroke="#64748b" stroke-width="2" rx="4"/>
                
                <!-- Coluna de Solução Floculante Transparente -->
                <rect x="37" y="50" width="46" height="163" fill="#e0f2fe" fill-opacity="0.6"/>
                
                <!-- Nível Argila (h2) -->
                <!-- Altura total de líquido: 160px. h2=88mm -> 95px de altura -->
                <rect x="37" y="118" width="46" height="95" fill="#fed7aa" fill-opacity="0.75"/>
                
                <!-- Nível Areia Decantada (h1) -->
                <!-- h1=61mm -> 66px de altura -->
                <rect x="37" y="147" width="46" height="66" fill="#fde047" fill-opacity="0.85"/>
                
                <!-- Cotas Laterais -->
                <!-- Cota h2 (Argila) -->
                <line x1="95" y1="118" x2="135" y2="118" stroke="#ea580c" stroke-width="1.5"/>
                <line x1="95" y1="213" x2="135" y2="213" stroke="#ea580c" stroke-width="1.5"/>
                <line x1="130" y1="118" x2="130" y2="213" stroke="#ea580c" stroke-width="1.5"/>
                <text x="140" y="165" fill="#ea580c" font-size="9.5" font-weight="800">h2 = ${h2.toFixed(1)} mm (Argila)</text>

                <!-- Cota h1 (Areia) -->
                <line x1="25" y1="147" x2="5" y2="147" stroke="#ca8a04" stroke-width="1.5"/>
                <line x1="25" y1="213" x2="5" y2="213" stroke="#ca8a04" stroke-width="1.5"/>
                <line x1="10" y1="147" x2="10" y2="213" stroke="#ca8a04" stroke-width="1.5"/>
                <text x="2" y="180" fill="#ca8a04" font-size="9.5" font-weight="800" text-anchor="end">h1 = ${h1.toFixed(1)} mm (Areia)</text>
            </g>

            <!-- Painel Matemático e Normativo -->
            <g transform="translate(370, 55)">
                <rect width="230" height="195" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
                <text x="18" y="26" fill="#64748b" font-size="8.5" font-weight="700" text-transform="uppercase">Fórmula Normativa DNER:</text>
                <text x="18" y="50" fill="#0f172a" font-size="12" font-weight="800 font-mono">EA = (h1 / h2) × 100</text>
                
                <line x1="18" y1="65" x2="212" y2="65" stroke="#f1f5f9"/>
                
                <text x="18" y="85" fill="#64748b" font-size="8.5">Equivalente de Areia Calculado:</text>
                <text x="18" y="120" fill="#4338ca" font-size="28" font-weight="900 font-mono">${ea.toFixed(1)}%</text>
                
                <text x="18" y="145" fill="#059669" font-size="9.5" font-weight="800">✓ Especificação: EA ≥ 55%</text>
                <text x="18" y="165" fill="#64748b" font-size="8">Agregado Miúdo Isento de Argilas e Finos Deletérios</text>
            </g>

            <rect x="70" y="295" width="530" height="20" fill="#f1f5f9" rx="4"/>
            <text x="335" y="308" fill="#475569" font-size="8" text-anchor="middle" font-weight="600">Método de Ensaio DNER-ME 054/97 • Solução Concentrada de Cloreto de Cálcio e Glicerina</text>
        </svg>
        `;
    }

    // 12. AGREGADOS - ABRASÃO LOS ANGELES (DNIT 157-ME)
    if (code.includes('157') || code.includes('LOS_ANGELES') || name.includes('los angeles') || name.includes('abrasão')) {
        const desgaste = Number(bench.desgaste_los_angeles) || 24.2;
        const limCapa = 30.0;
        const limBase = 40.0;

        return `
        <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
            <text x="325" y="32" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">ENSAIO DE ABRASÃO LOS ANGELES • DNIT 157-ME (DESGASTE %)</text>

            <g transform="translate(90, 60)">
                <!-- Barra 1: Amostra -->
                <text x="0" y="25" fill="#0f172a" font-size="11" font-weight="800">Amostra Analisada (Brita Rodoviária):</text>
                <rect x="0" y="35" width="470" height="24" rx="4" fill="#e2e8f0"/>
                <rect x="0" y="35" width="${(desgaste / 50) * 470}" height="24" rx="4" fill="#4338ca"/>
                <text x="${(desgaste / 50) * 470 + 8}" y="52" fill="#4338ca" font-size="12" font-weight="900 font-mono">${desgaste.toFixed(1)}%</text>

                <!-- Barra 2: Limite Capa de Rolamento CBUQ -->
                <text x="0" y="95" fill="#475569" font-size="10" font-weight="700">Limite Máximo para Capa Asfáltica (CBUQ):</text>
                <rect x="0" y="105" width="470" height="20" rx="4" fill="#fee2e2"/>
                <rect x="0" y="105" width="${(limCapa / 50) * 470}" height="20" rx="4" fill="#ef4444" fill-opacity="0.7"/>
                <text x="${(limCapa / 50) * 470 + 8}" y="120" fill="#dc2626" font-size="11" font-weight="800 font-mono">≤ 30,0%</text>

                <!-- Barra 3: Limite Base Graduada -->
                <text x="0" y="160" fill="#475569" font-size="10" font-weight="700">Limite Máximo para Base de Brita Graduada (BGS):</text>
                <rect x="0" y="170" width="470" height="20" rx="4" fill="#fef3c7"/>
                <rect x="0" y="170" width="${(limBase / 50) * 470}" height="20" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
                <text x="${(limBase / 50) * 470 + 8}" y="185" fill="#d97706" font-size="11" font-weight="800 font-mono">≤ 40,0%</text>
            </g>

            <rect x="90" y="285" width="470" height="24" fill="#dcfce7" rx="4" stroke="#10b981"/>
            <text x="325" y="301" fill="#15803d" font-size="9.5" text-anchor="middle" font-weight="800">
                ✓ MATERIAL APROVADO: Desgaste ${desgaste.toFixed(1)}% atende com folga as especificações para Capa e Base
            </text>
        </svg>
        `;
    }

    // 13. FALLBACK / GAUGE NORMATIVO GERAL DE CONFORMIDADE DNIT
    return `
    <svg viewBox="0 0 650 330" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <rect width="650" height="330" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="325" y="35" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">AVALIAÇÃO DE CONFORMIDADE NORMATIVA DNIT / DNER</text>

        <!-- Arco Central de Conformidade -->
        <g transform="translate(325, 180)">
            <path d="M -150,0 A 150,150 0 0,1 150,0" fill="none" stroke="#e2e8f0" stroke-width="24" stroke-linecap="round"/>
            <path d="M -150,0 A 150,150 0 0,1 150,0" fill="none" stroke="${statusColor}" stroke-width="24" stroke-linecap="round" stroke-dasharray="471" stroke-dashoffset="${isApproved ? '0' : isRessalva ? '150' : '320'}"/>
            
            <text x="0" y="-30" fill="#0f172a" font-size="22" font-weight="900" text-anchor="middle">${test.status.toUpperCase()}</text>
            <text x="0" y="-5" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">Resultado: ${test.resultValue}</text>
            <text x="0" y="20" fill="#475569" font-size="9" text-anchor="middle">Tolerância: ${test.nominalExpected}</text>
        </g>

        <rect x="80" y="260" width="490" height="45" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="325" y="280" fill="#1e293b" font-size="9.5" font-weight="700" text-anchor="middle">Parâmetro: ${test.testName} (${test.testCode})</text>
        <text x="325" y="296" fill="#64748b" font-size="8.5" text-anchor="middle">Regulamentação: ${test.standardNorm} • Controle Tecnológico InfraCore BETA</text>
    </svg>
    `;
};

export const generateLabReportHtml = (test: DNITLabTest): string => {
    const isApproved = test.status === 'Aprovado';
    const isRessalva = test.status === 'Ressalva';
    const statusColor = isApproved ? '#059669' : isRessalva ? '#d97706' : '#dc2626';
    const statusBg = isApproved ? '#ecfdf5' : isRessalva ? '#fffbeb' : '#fef2f2';

    const benchEntries = test.benchData ? Object.entries(test.benchData) : [];
    const svgDiagram = generateTestSvgDiagram(test);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Laudo Técnico de Ensaio Laboratorial - ${test.testCode}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            font-size: 10.5pt;
            background: #fff;
        }
        .page {
            box-sizing: border-box;
            position: relative;
        }
        .page-break {
            page-break-before: always;
            break-before: page;
            margin-top: 30px;
            padding-top: 10px;
        }
        .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .header-title h1 {
            font-size: 15pt;
            font-weight: 800;
            text-transform: uppercase;
            margin: 0 0 3px 0;
            letter-spacing: -0.5px;
            color: #0f172a;
        }
        .header-title p {
            font-size: 8pt;
            color: #64748b;
            margin: 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .report-badge {
            text-align: right;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            border-radius: 6px;
            background: #f8fafc;
        }
        .report-badge .code {
            font-family: monospace;
            font-size: 10.5pt;
            font-weight: 800;
            color: #4338ca;
            display: block;
        }
        .report-badge .date {
            font-size: 7.5pt;
            color: #64748b;
        }
        .section-title {
            font-size: 9pt;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.8px;
            margin-top: 14px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
        }
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 10px;
        }
        .info-card .label {
            font-size: 7pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
        }
        .info-card .val {
            font-size: 9pt;
            font-weight: 700;
            color: #0f172a;
        }
        .status-box {
            background: ${statusBg};
            border: 2px solid ${statusColor};
            border-radius: 6px;
            padding: 10px 14px;
            margin: 12px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-title {
            font-size: 12pt;
            font-weight: 800;
            text-transform: uppercase;
            color: ${statusColor};
            margin: 0;
        }
        .status-sub {
            font-size: 8pt;
            color: #475569;
            margin-top: 2px;
        }
        table.tech-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8.5pt;
        }
        table.tech-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 800;
            text-transform: uppercase;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
            font-size: 7.5pt;
        }
        table.tech-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
        }
        .notes-box {
            background: #ffffff;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 8.5pt;
            color: #334155;
            margin-bottom: 16px;
        }
        .signatures {
            margin-top: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            text-align: center;
            page-break-inside: avoid;
        }
        .sign-line {
            border-top: 1px solid #334155;
            padding-top: 5px;
        }
        .sign-name {
            font-size: 8.5pt;
            font-weight: 700;
            color: #0f172a;
        }
        .sign-role {
            font-size: 7.5pt;
            color: #64748b;
        }
        .page-footer {
            margin-top: 20px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            font-size: 7pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }
        .diagram-container {
            margin: 14px 0;
            text-align: center;
        }
        @media print {
            body {
                background: none;
            }
            .page-break {
                page-break-before: always;
                break-before: page;
            }
        }
    </style>
</head>
<body>
    <!-- ================= PÁGINA 1: CERTIFICADO & PARECER TÉCNICO ================= -->
    <div class="page">
        <div class="header">
            <div class="header-title">
                <h1>InfraCore BETA • Controle Tecnológico</h1>
                <p>Laboratório de Engenharia Rodoviária, Pavimentação, Solos e Concreto</p>
            </div>
            <div class="report-badge">
                <span class="code">LAUDO #${test.id.slice(-8).toUpperCase()}</span>
                <span class="date">Pág. 1 de 2 • Emissão: ${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
        </div>

        <div class="section-title">1. Dados do Ensaio e Identificação da Amostra</div>
        <div class="grid-2">
            <div class="info-card">
                <span class="label">Ensaio Técnico Executado</span>
                <span class="val">${test.testName} (${test.testCode})</span>
            </div>
            <div class="info-card">
                <span class="label">Resolução / Norma Regulamentadora</span>
                <span class="val">${test.standardNorm}</span>
            </div>
            <div class="info-card">
                <span class="label">Material / Tipo de Amostra</span>
                <span class="val">${test.sampleType || test.productName}</span>
            </div>
            <div class="info-card">
                <span class="label">Lote / Batelada de Origem</span>
                <span class="val">${test.batchNumber}</span>
            </div>
            <div class="info-card">
                <span class="label">Origem & Regime de Controle</span>
                <span class="val">${test.orderNumber ? `Ordem de Produção #${test.orderNumber}` : 'Controle Independente / Jazida / Pilha'}</span>
            </div>
            <div class="info-card">
                <span class="label">Unidade Fabril / Planta Produtora</span>
                <span class="val">${test.unitName || 'Central de Usinagem Principal'}</span>
            </div>
            <div class="info-card">
                <span class="label">Localização da Coleta / Trecho / Estaca</span>
                <span class="val">${test.locationOrStation || 'Pátio Industrial / Frente de Obra'}</span>
            </div>
            <div class="info-card">
                <span class="label">Pedreira / Fornecedor / Jazida</span>
                <span class="val">${test.supplierOrQuarry || 'Produção Interna / Jazida'}</span>
            </div>
            <div class="info-card">
                <span class="label">Data de Realização do Ensaio</span>
                <span class="val">${test.testedAt}</span>
            </div>
            <div class="info-card">
                <span class="label">Módulo Técnico Operacional</span>
                <span class="val">${test.module ? test.module.toUpperCase() : 'CONTROLE TECNOLÓGICO'}</span>
            </div>
        </div>

        <div class="section-title">2. Matriz Paramétrica e Resultados de Bancada</div>
        <table class="tech-table">
            <thead>
                <tr>
                    <th>Parâmetro de Controle</th>
                    <th>Especificação Normativa / Tolerância</th>
                    <th>Resultado Obtido</th>
                    <th>Conformidade</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>${test.testName}</strong></td>
                    <td>${test.nominalExpected}</td>
                    <td><strong style="color: #4338ca; font-size: 10pt;">${test.resultValue}</strong></td>
                    <td><span style="font-weight: 800; color: ${statusColor}; text-transform: uppercase;">${test.status}</span></td>
                </tr>
                ${benchEntries.map(([k, v]) => `
                <tr>
                    <td style="color: #475569; font-size: 8pt;">• Medição Bruta: ${k.replace(/_/g, ' ')}</td>
                    <td style="color: #94a3b8; font-size: 7.5pt;">Registro Direto de Bancada</td>
                    <td colspan="2" style="font-family: monospace; font-size: 8.5pt;">${v}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="status-box">
            <div>
                <h2 class="status-title">Parecer Técnico: ${test.status === 'Aprovado' ? 'CONFORME / APROVADO' : test.status === 'Ressalva' ? 'LIBERAÇÃO CONDICIONAL COM RESSALVA' : 'NÃO CONFORME / REPROVADO'}</h2>
                <div class="status-sub">Atendimento às diretrizes do Manual de Pavimentação do DNIT e normas regulamentadoras ABNT/DNER.</div>
            </div>
            <div style="font-weight: 900; font-size: 18pt; color: ${statusColor};">
                ${isApproved ? '✓' : isRessalva ? '⚠' : '✕'}
            </div>
        </div>

        <div class="section-title">3. Parecer e Notas Técnicas Circunstanciadas</div>
        <div class="notes-box">
            ${test.notes || 'Ensaio realizado conforme os procedimentos e tolerâncias normativas vigentes sem desvios de método.'}
            ${test.conditionalRelease ? '<br><strong style="color: #d97706; display: block; margin-top: 5px;">[RESSALVA TÉCNICA]: Lote liberado condicionalmente com monitoramento de desempenho em pista/obra e aprovação da supervisão técnica.</strong>' : ''}
        </div>

        <div class="signatures">
            <div>
                <div class="sign-line">
                    <div class="sign-name">${test.tester || 'Técnico de Laboratório'}</div>
                    <div class="sign-role">Laboratorista Especialista em Controle Tecnológico</div>
                </div>
            </div>
            <div>
                <div class="sign-line">
                    <div class="sign-name">${test.supervisor || 'Eng. Responsável Técnico'}</div>
                    <div class="sign-role">Responsável Técnico / CREA</div>
                </div>
            </div>
        </div>

        <div class="page-footer">
            <span>InfraCore BETA • Sistema Integrado de Engenharia Rodoviária</span>
            <span>Página 1 de 2 • Continua no Anexo Gráfico Técnico (Pág. 2)</span>
        </div>
    </div>

    <!-- ================= PÁGINA 2: ANEXO GRÁFICO NORMATIVO & CURVAS DE ENSAIO ================= -->
    <div class="page page-break">
        <div class="header">
            <div class="header-title">
                <h1>InfraCore BETA • Anexo Gráfico & Curvas de Ensaio</h1>
                <p>Modelagem Gráfica, Curvas Experimentais e Envelopes Normativos DNIT</p>
            </div>
            <div class="report-badge">
                <span class="code">ANEXO #${test.id.slice(-8).toUpperCase()}</span>
                <span class="date">Pág. 2 de 2 • Dossiê Conclusivo</span>
            </div>
        </div>

        <div class="grid-2" style="margin-bottom: 8px;">
            <div class="info-card">
                <span class="label">Ensaio / Norma Vinculada</span>
                <span class="val">${test.testName} • ${test.standardNorm}</span>
            </div>
            <div class="info-card">
                <span class="label">Amostra / Origem Rastreável</span>
                <span class="val">${test.batchNumber} • ${test.locationOrStation || 'Pátio Industrial'}</span>
            </div>
        </div>

        <div class="section-title">4. Diagrama Normativo DNIT & Modelagem Gráfica de Laboratório</div>
        
        <div class="diagram-container">
            ${svgDiagram}
        </div>

        <div class="section-title">5. Memória Metodológica & Notas de Interpretação da Curva</div>
        <div class="notes-box" style="margin-bottom: 12px; font-size: 8pt; line-height: 1.45;">
            <strong>INTERPRETAÇÃO TÉCNICA DO GRÁFICO:</strong><br>
            • As curvas, envelopes e pontos plotados acima foram gerados a partir dos dados brutos registrados na bancada de ensaio.<br>
            • Os limites e critérios de aceitabilidade obedecem rigorosamente aos manuais de projetos e normas vigentes do DNIT (Departamento Nacional de Infraestrutura de Transportes) e ABNT.<br>
            • Os equipamentos utilizados possuem calibração metrológica com rastreabilidade RBC (Rede Brasileira de Calibração) e Inmetro.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc;">
            <div>
                <span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase; display: block;">Chancela de Autenticidade Metrológica</span>
                <span style="font-size: 8.5pt; font-weight: 700; color: #0f172a;">Documento Gerado Eletronicamente pelo InfraCore BETA Controle Tecnológico</span>
            </div>
            <div style="text-align: right; font-family: monospace; font-size: 8pt; color: #4338ca; font-weight: 800;">
                SEC-DNIT-${test.id.slice(-6).toUpperCase()}
            </div>
        </div>

        <div class="page-footer">
            <span>InfraCore ERP • Engenharia de Produção & Usinas</span>
            <span>Página 2 de 2 • Fim do Dossiê Técnico de Laboratório</span>
        </div>
    </div>
</body>
</html>
    `.trim();
};

const Production = () => {
    const {
        inventory, productionOrders, formulas, productionUnits,
        addProductionOrder, updateProductionOrder, deleteProductionOrder,
        startProduction, completeProduction, addQualityTest,
        addProductionUnit, updateProductionUnit, deleteProductionUnit,
        addFormula, updateFormula, deleteFormula
    } = useApp();
    const { addToast } = useToast();

    // Sincroniza referências para invocações sem argumentos explícitos de lista
    currentFormulasRef = formulas;
    currentInventoryRef = inventory;
    const [activeTab, setActiveTab] = useState<'monitor' | 'orders' | 'formulas' | 'lab'>('monitor');

    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

    const [editingUnit, setEditingUnit] = useState<ProductionUnit | null>(null);
    const [editingFormula, setEditingFormula] = useState<ProductionFormula | null>(null);
    const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

    // Filter & Search states for Orders
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');
    const [orderPriorityFilter, setOrderPriorityFilter] = useState<string>('Todas');
    const [orderUnitFilter, setOrderUnitFilter] = useState<string>('Todas');

    // Filter & Search states for Formulas
    const [formulaSearch, setFormulaSearch] = useState('');
    const [formulaCategoryFilter, setFormulaCategoryFilter] = useState<string>('Todas');

    // Forms State
    const [newOrder, setNewOrder] = useState<Partial<ProductionOrder>>({
        priority: 'Média',
        status: 'Planejado',
        progress: 0,
        unitId: 'u1',
        quantity: 100,
        batch: `L${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 100)}`
    });

    // -------------------------------------------------------------------------
    // ESTADOS AVANÇADOS DO LABORATÓRIO E CONTROLE TECNOLÓGICO DNIT
    // -------------------------------------------------------------------------
    const [selectedLabModule, setSelectedLabModule] = useState<LabModuleType>('asfalto');
    const [labSearch, setLabSearch] = useState('');
    const [labStatusFilter, setLabStatusFilter] = useState<string>('Todos');
    const [isDNITModalOpen, setIsDNITModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [activeReportTest, setActiveReportTest] = useState<DNITLabTest | null>(null);

    // Repositório persistido em LocalStorage com fallback para carga inicial
    const [labTests, setLabTests] = useState<DNITLabTest[]>(() => {
        try {
            const saved = localStorage.getItem('infracore_lab_dnit_tests_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Erro ao ler testes laboratoriais do storage:', e);
        }
        return INITIAL_DNIT_LAB_TESTS;
    });

    useEffect(() => {
        try {
            localStorage.setItem('infracore_lab_dnit_tests_v2', JSON.stringify(labTests));
        } catch (e) {
            console.error('Erro ao persistir testes laboratoriais:', e);
        }
    }, [labTests]);

    // Formulário de Cadastro e Bancada Assistida DNIT
    const [dnitForm, setDnitForm] = useState({
        module: 'asfalto' as LabModuleType,
        selectedTestId: 'asf-betume',
        orderId: '', // Vínculo 100% opcional
        batchNumber: `L${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 900 + 100)}`,
        sampleType: '',
        locationOrStation: '', // Trecho, estaca ou rodovia
        supplierOrQuarry: '', // Pedreira, refinaria ou fornecedor
        tester: 'Laboratorista Técnico Especialista',
        supervisor: 'Eng. Responsável Técnico - CREA',
        testedAt: new Date().toISOString().split('T')[0],
        resultValue: '',
        status: 'Aprovado' as 'Aprovado' | 'Reprovado' | 'Ressalva',
        conditionalRelease: false,
        notes: '',
        isBenchExpanded: true,
        benchValues: {} as Record<string, any>
    });

    const activeTestDef = useMemo(() => {
        return DNIT_TEST_CATALOG.find(t => t.id === dnitForm.selectedTestId) || DNIT_TEST_CATALOG[0];
    }, [dnitForm.selectedTestId]);

    // Atualização reativa de cálculos assistidos conforme o usuário digita na bancada
    const handleBenchFieldChange = (key: string, val: string) => {
        const numVal = parseFloat(val);
        const updatedBench = { ...dnitForm.benchValues, [key]: isNaN(numVal) ? val : numVal };
        let computedResult = dnitForm.resultValue;
        let computedStatus: 'Aprovado' | 'Reprovado' | 'Ressalva' = dnitForm.status;

        // Regras específicas de cálculo assistido de engenharia por ensaio DNIT
        if (dnitForm.selectedTestId === 'sol-frasco-areia') {
            const mSolo = parseFloat(updatedBench.massa_solo_umido_g);
            const mAreia = parseFloat(updatedBench.massa_areia_utilizada_g);
            const dAreia = parseFloat(updatedBench.densidade_areia_padrao || '1.420');
            const w = parseFloat(updatedBench.umidade_campo_percent);
            const dSecaMax = parseFloat(updatedBench.densidade_seca_max_proctor);
            const gcMin = parseFloat(updatedBench.gc_minimo_exigido || '100.0');
            if (!isNaN(mSolo) && !isNaN(mAreia) && mAreia > 0 && dAreia > 0 && !isNaN(w) && !isNaN(dSecaMax) && dSecaMax > 0) {
                const volFuro = mAreia / dAreia;
                const dUmida = mSolo / volFuro;
                const dSeca = Number((dUmida / (1 + w / 100)).toFixed(3));
                const gc = Number(((dSeca / dSecaMax) * 100).toFixed(1));
                computedResult = `GC = ${gc}% (γd = ${dSeca} g/cm³ | w = ${w}%)`;
                computedStatus = gc >= gcMin ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-cbr') {
            const cbr = parseFloat(updatedBench.cbr_calculado_percent);
            const cbrMin = parseFloat(updatedBench.cbr_minimo_projeto || '12.0');
            const exp = parseFloat(updatedBench.expansao_percent);
            const expMax = parseFloat(updatedBench.expansao_maxima_tolerada || '1.0');
            if (!isNaN(cbr)) {
                const expStr = !isNaN(exp) ? ` | Expansão: ${exp}%` : '';
                computedResult = `CBR = ${cbr}%${expStr}`;
                const cbrOk = cbr >= cbrMin;
                const expOk = isNaN(exp) || exp <= expMax;
                computedStatus = (cbrOk && expOk) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-atterberg') {
            const ll = parseFloat(updatedBench.limite_liquidez_ll);
            const lp = parseFloat(updatedBench.limite_plasticidade_lp);
            const ipMax = parseFloat(updatedBench.ip_maximo_tolerado || '12.0');
            if (!isNaN(ll) && !isNaN(lp)) {
                const ip = Number((ll - lp).toFixed(1));
                const plastDesc = ip <= 0 ? 'Não Plástico (NP)' : ip <= 7 ? 'Fracamente Plástico' : ip <= 15 ? 'Medianamente Plástico' : 'Altamente Plástico';
                computedResult = `LL: ${ll}% | LP: ${lp}% | IP = ${ip}% (${plastDesc})`;
                computedStatus = ip <= ipMax ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-speedy') {
            const wSp = parseFloat(updatedBench.umidade_speedy_medida);
            const wOt = parseFloat(updatedBench.umidade_otima_proctor || '13.5');
            const tol = parseFloat(updatedBench.tolerancia_desvio_umidade || '2.0');
            if (!isNaN(wSp)) {
                const diff = Number(Math.abs(wSp - wOt).toFixed(1));
                computedResult = `Umidade Speedy: ${wSp}% (Desvio de ${diff}% em relação a wot)`;
                computedStatus = diff <= tol ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-proctor') {
            const dMax = parseFloat(updatedBench.massa_especifica_seca_max);
            const wOt = parseFloat(updatedBench.umidade_otima_percent);
            const nrg = updatedBench.energia_compactacao || 'Proctor Intermediária';
            if (!isNaN(dMax) && !isNaN(wOt)) {
                computedResult = `γd,max = ${dMax} g/cm³ | wot = ${wOt}% (${nrg})`;
                computedStatus = 'Aprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-gran-conjunta') {
            const ped = parseFloat(updatedBench.perc_pedregulho || '0');
            const areia = parseFloat(updatedBench.perc_areia || '0');
            const silte = parseFloat(updatedBench.perc_silte || '0');
            const argila = parseFloat(updatedBench.perc_argila || '0');
            const finos = Number((silte + argila).toFixed(1));
            computedResult = `Pedregulho: ${ped}% | Areia: ${areia}% | Finos (Silte+Argila): ${finos}%`;
            computedStatus = 'Aprovado';
        } else if (dnitForm.selectedTestId === 'sol-hrb') {
            const p200 = parseFloat(updatedBench.passante_peneira_n200);
            const ll = parseFloat(updatedBench.limite_liquidez_val);
            const ip = parseFloat(updatedBench.indice_plasticidade_val);
            const grupoDec = updatedBench.classificacao_hrb_declarada || 'A-2-4';
            if (!isNaN(p200) && !isNaN(ll) && !isNaN(ip)) {
                const a = Math.max(0, Math.min(40, p200 - 35));
                const b = Math.max(0, Math.min(40, p200 - 15));
                const c = Math.max(0, Math.min(20, ll - 40));
                const d = Math.max(0, Math.min(20, ip - 10));
                const ig = Math.max(0, Math.round(0.2 * a + 0.005 * a * c + 0.01 * b * d));
                computedResult = `Classificação: ${grupoDec} (IG = ${ig})`;
                computedStatus = 'Aprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-dens-graos') {
            const m1 = parseFloat(updatedBench.massa_picnometro_cheio_agua);
            const m2 = parseFloat(updatedBench.massa_picnometro_solo_agua);
            const ms = parseFloat(updatedBench.massa_solo_seco_estufa || '50.0');
            if (!isNaN(m1) && !isNaN(m2) && !isNaN(ms) && (ms + m1 - m2) > 0) {
                const rhoS = Number((ms / (ms + m1 - m2)).toFixed(3));
                computedResult = `Massa Específica dos Grãos (ρs) = ${rhoS} g/cm³`;
                computedStatus = (rhoS >= 2.50 && rhoS <= 2.90) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'sol-mct') {
            const cLinha = parseFloat(updatedBench.coeficiente_c_linha);
            const pi = parseFloat(updatedBench.perda_massa_imersao_pi);
            const classe = updatedBench.classe_mct_obtida || 'LA\' (Laterítico)';
            if (!isNaN(cLinha) && !isNaN(pi)) {
                computedResult = `MCT: ${classe} (c' = ${cLinha} | Pi = ${pi}%)`;
                computedStatus = 'Aprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-ea') {
            const h1 = parseFloat(updatedBench.h1_areia);
            const h2 = parseFloat(updatedBench.h2_argila);
            if (!isNaN(h1) && !isNaN(h2) && h2 > 0) {
                const ea = Number(((h1 / h2) * 100).toFixed(1));
                computedResult = `EA = ${ea}%`;
                computedStatus = ea >= 55 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-la') {
            const m1 = parseFloat(updatedBench.m1_inicial);
            const m2 = parseFloat(updatedBench.m2_retida12);
            if (!isNaN(m1) && !isNaN(m2) && m1 > 0) {
                const la = Number((((m1 - m2) / m1) * 100).toFixed(1));
                computedResult = `Perda por abrasão: ${la}%`;
                computedStatus = la <= 40 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-forma') {
            const c = parseFloat(updatedBench.comprimento_medio);
            const e = parseFloat(updatedBench.espessura_media);
            if (!isNaN(c) && !isNaN(e) && c > 0) {
                const forma = Number((e / c).toFixed(2));
                computedResult = `Índice de Forma Médio = ${forma}`;
                computedStatus = forma >= 0.50 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-dens-miudo') {
            const a = parseFloat(updatedBench.massa_seca_estufa);
            const s = parseFloat(updatedBench.massa_sss_cone || '500');
            const v = parseFloat(updatedBench.volume_deslocado_ml);
            if (!isNaN(a) && a > 0 && !isNaN(s)) {
                const abs = Number((((s - a) / a) * 100).toFixed(2));
                let dRealStr = '';
                if (!isNaN(v) && (v - (s - a)) > 0) {
                    const dReal = Number((a / (v - (s - a))).toFixed(3));
                    dRealStr = ` | d_real: ${dReal} g/cm³`;
                }
                computedResult = `Absorção: ${abs}%${dRealStr}`;
                computedStatus = abs <= 2.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-dens-graudo') {
            const a = parseFloat(updatedBench.massa_seca_estufa_g);
            const b = parseFloat(updatedBench.massa_sss_ar_g);
            const c = parseFloat(updatedBench.massa_submersa_agua_g);
            if (!isNaN(a) && !isNaN(b) && a > 0) {
                const abs = Number((((b - a) / a) * 100).toFixed(2));
                let dApStr = '';
                if (!isNaN(c) && (b - c) > 0) {
                    const dAp = Number((a / (b - c)).toFixed(3));
                    dApStr = ` | Massa Específica Aparente: ${dAp} g/cm³`;
                }
                computedResult = `Absorção d'água: ${abs}%${dApStr}`;
                computedStatus = abs <= 1.5 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-torroes') {
            const mi = parseFloat(updatedBench.massa_inicial_amostra);
            const mr = parseFloat(updatedBench.massa_retida_apos_atrito);
            if (!isNaN(mi) && !isNaN(mr) && mi > 0) {
                const torroes = Number((((mi - mr) / mi) * 100).toFixed(2));
                computedResult = `Torrões de Argila: ${torroes}%`;
                computedStatus = torroes <= 1.5 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-sanidade') {
            const mi = parseFloat(updatedBench.massa_inicial_ciclos);
            const mf = parseFloat(updatedBench.massa_final_lavada);
            if (!isNaN(mi) && !isNaN(mf) && mi > 0) {
                const perda = Number((((mi - mf) / mi) * 100).toFixed(1));
                computedResult = `Perda por Sanidade: ${perda}%`;
                computedStatus = perda <= 12.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'ag-finos-200') {
            const ma = parseFloat(updatedBench.massa_amostra_seca_antes);
            const mp = parseFloat(updatedBench.massa_amostra_seca_apos);
            if (!isNaN(ma) && !isNaN(mp) && ma > 0) {
                const finos = Number((((ma - mp) / ma) * 100).toFixed(2));
                computedResult = `Finos Peneira #200: ${finos}%`;
                computedStatus = finos <= 1.5 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-betume') {
            const mi = parseFloat(updatedBench.massa_inicial_mistura);
            const mf = parseFloat(updatedBench.massa_agregados_recuperados);
            const me = parseFloat(updatedBench.massa_filler_filtro || '0');
            const targetPb = parseFloat(updatedBench.teor_projeto || '5.20');
            if (!isNaN(mi) && !isNaN(mf) && mi > 0) {
                const pb = Number((((mi - (mf + me)) / mi) * 100).toFixed(2));
                computedResult = `Teor de Ligante: ${pb}%`;
                const diff = Math.abs(pb - targetPb);
                computedStatus = diff <= 0.30 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-temp') {
            const u = parseFloat(updatedBench.temp_saida_usina);
            const p = parseFloat(updatedBench.temp_chegada_pista);
            const r = parseFloat(updatedBench.temp_inicio_rolamento);
            if (!isNaN(u)) {
                computedResult = `Usina: ${u}°C ${!isNaN(p) ? `| Pista: ${p}°C` : ''} ${!isNaN(r) ? `| Rolo: ${r}°C` : ''}`;
                const usinaOk = u >= 145 && u <= 175;
                const pistaOk = isNaN(p) || p >= 135;
                const roloOk = isNaN(r) || r >= 120;
                computedStatus = (usinaOk && pistaOk && roloOk) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-marshall') {
            const est = parseFloat(updatedBench.estabilidade_kgf);
            const flu = parseFloat(updatedBench.fluencia_mm);
            const gmb = parseFloat(updatedBench.densidade_aparente_gmb);
            const gmm = parseFloat(updatedBench.densidade_maxima_gmm);
            let vvStr = '';
            if (!isNaN(gmb) && !isNaN(gmm) && gmm > 0) {
                const vv = Number((((gmm - gmb) / gmm) * 100).toFixed(1));
                vvStr = ` | Vv: ${vv}%`;
            }
            if (!isNaN(est) || !isNaN(flu)) {
                computedResult = `Estabilidade: ${est || '-'} kgf | Fluência: ${flu || '-'} mm${vvStr}`;
                const estOk = isNaN(est) || est >= 800;
                const fluOk = isNaN(flu) || (flu >= 2.0 && flu <= 4.5);
                computedStatus = (estOk && fluOk) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-rt') {
            const p = parseFloat(updatedBench.carga_ruptura_kn);
            const d = parseFloat(updatedBench.diametro_cp_mm || '101.6');
            const h = parseFloat(updatedBench.altura_cp_mm || '63.5');
            if (!isNaN(p) && d > 0 && h > 0) {
                const rt = Number(((2 * (p * 1000)) / (Math.PI * d * h)).toFixed(2));
                computedResult = `RT = ${rt} MPa`;
                computedStatus = rt >= 0.65 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-gc-pista') {
            const inSitu = parseFloat(updatedBench.densidade_in_situ_g_cm3);
            const proj = parseFloat(updatedBench.densidade_projeto_g_cm3);
            if (!isNaN(inSitu) && !isNaN(proj) && proj > 0) {
                const gc = Number(((inSitu / proj) * 100).toFixed(1));
                computedResult = `Grau de Compactação (GC): ${gc}%`;
                computedStatus = (gc >= 97.0 && gc <= 102.0) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-rtr-lottman') {
            const seco = parseFloat(updatedBench.rt_amostra_seca_mpa);
            const cond = parseFloat(updatedBench.rt_amostra_condicionada_mpa);
            if (!isNaN(seco) && !isNaN(cond) && seco > 0) {
                const rtr = Number(((cond / seco) * 100).toFixed(1));
                computedResult = `RTR = ${rtr}%`;
                computedStatus = rtr >= 80.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-mr') {
            const tensao = parseFloat(updatedBench.tensao_repetida_mpa);
            const def = parseFloat(updatedBench.deformacao_resiliente_um);
            if (!isNaN(tensao) && !isNaN(def) && def > 0) {
                const mr = Math.round((tensao / (def * 1e-6)) * 1e-6);
                computedResult = `Módulo de Resiliência: ${mr.toLocaleString('pt-BR')} MPa`;
                computedStatus = mr >= 3000 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-anel-bola') {
            const t1 = parseFloat(updatedBench.temp_amolecimento_1);
            const t2 = parseFloat(updatedBench.temp_amolecimento_2);
            if (!isNaN(t1)) {
                const media = !isNaN(t2) ? Number(((t1 + t2) / 2).toFixed(1)) : t1;
                computedResult = `Ponto de Amolecimento: ${media}°C`;
                computedStatus = media >= 46.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-penetracao') {
            const p1 = parseFloat(updatedBench.leitura_pen_1);
            const p2 = parseFloat(updatedBench.leitura_pen_2);
            const p3 = parseFloat(updatedBench.leitura_pen_3);
            const validPens = [p1, p2, p3].filter(n => !isNaN(n));
            if (validPens.length > 0) {
                const media = Math.round(validPens.reduce((a, b) => a + b, 0) / validPens.length);
                computedResult = `Penetração Média: ${media} dmm (0,1 mm)`;
                computedStatus = (media >= 50 && media <= 70) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'asf-emulsao') {
            const res = parseFloat(updatedBench.residuo_evaporacao_percent);
            if (!isNaN(res)) {
                computedResult = `Resíduo por Evaporação: ${res}%`;
                computedStatus = res >= 60.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-slump') {
            const med = parseFloat(updatedBench.slump_medido);
            const proj = parseFloat(updatedBench.slump_projeto || '10.0');
            const tol = parseFloat(updatedBench.tolerancia_normativa || '2.0');
            if (!isNaN(med)) {
                computedResult = `Slump medido: ${med} cm (Projeto: ${proj} ± ${tol} cm)`;
                const diff = Math.abs(med - proj);
                computedStatus = diff <= tol ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-fck') {
            const forcaKn = parseFloat(updatedBench.forca_prensa_kn);
            const diam = parseFloat(updatedBench.diametro_cilindro_cm || '10.0');
            const projFck = parseFloat(updatedBench.fck_nominal_projeto || '30.0');
            const idade = parseFloat(updatedBench.idade_dias || '28');
            if (!isNaN(forcaKn) && diam > 0) {
                const areaCm2 = Math.PI * Math.pow(diam / 2, 2);
                const tensaoMpa = Number(((forcaKn * 10) / areaCm2).toFixed(1));
                computedResult = `fck atingido: ${tensaoMpa} MPa (${idade} dias)`;
                const minReq = idade <= 7 ? projFck * 0.70 : projFck;
                computedStatus = tensaoMpa >= minReq ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-fctm') {
            const p = parseFloat(updatedBench.carga_flexao_kn);
            const l = parseFloat(updatedBench.vao_livre_l_cm || '45.0');
            const b = parseFloat(updatedBench.largura_b_cm || '15.0');
            const h = parseFloat(updatedBench.altura_h_cm || '15.0');
            if (!isNaN(p) && b > 0 && h > 0) {
                const fctM = Number(((p * 1000 * (l * 10)) / ((b * 10) * Math.pow(h * 10, 2))).toFixed(2));
                computedResult = `fctM,k = ${fctM} MPa aos 28 dias`;
                computedStatus = fctM >= 4.5 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-ac') {
            const agua = parseFloat(updatedBench.agua_efetiva_litros);
            const cim = parseFloat(updatedBench.consumo_cimento_kg);
            if (!isNaN(agua) && !isNaN(cim) && cim > 0) {
                const ac = Number((agua / cim).toFixed(2));
                computedResult = `Relação a/c = ${ac}`;
                computedStatus = ac <= 0.45 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-ar-incorporado') {
            const ar = parseFloat(updatedBench.leitura_manometro_ar);
            if (!isNaN(ar)) {
                computedResult = `Teor de Ar: ${ar}%`;
                computedStatus = (ar >= 3.0 && ar <= 6.0) ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-rt-diametral') {
            const f = parseFloat(updatedBench.forca_ruptura_kn);
            const d = parseFloat(updatedBench.diametro_d_cm || '15.0');
            const l = parseFloat(updatedBench.comprimento_l_cm || '30.0');
            if (!isNaN(f) && d > 0 && l > 0) {
                const fctSp = Number(((2 * f * 10) / (Math.PI * d * l)).toFixed(2));
                computedResult = `fct,sp = ${fctSp} MPa aos 28 dias`;
                computedStatus = fctSp >= 3.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-absorcao-vazios') {
            const ms = parseFloat(updatedBench.massa_seca_estufa_ms);
            const msat = parseFloat(updatedBench.massa_saturada_fervida_msat);
            if (!isNaN(ms) && !isNaN(msat) && ms > 0) {
                const abs = Number((((msat - ms) / ms) * 100).toFixed(2));
                computedResult = `Absorção pós-fervura: ${abs}%`;
                computedStatus = abs <= 5.0 ? 'Aprovado' : 'Reprovado';
            }
        } else if (dnitForm.selectedTestId === 'cnc-espessura-placa') {
            const nom = parseFloat(updatedBench.espessura_nominal_projeto || '22.0');
            const med = parseFloat(updatedBench.leitura_media_paquimetro);
            if (!isNaN(med) && !isNaN(nom)) {
                computedResult = `Espessura medida: ${med} cm (Projeto: ${nom} cm)`;
                computedStatus = med >= (nom - 0.5) ? 'Aprovado' : 'Reprovado';
            }
        }

        setDnitForm(prev => ({
            ...prev,
            benchValues: updatedBench,
            resultValue: computedResult,
            status: computedStatus
        }));
    };

    const handleOpenNewTestModal = (modulePreselect?: LabModuleType, order?: ProductionOrder) => {
        const targetModule = modulePreselect || selectedLabModule;
        const availableInModule = DNIT_TEST_CATALOG.filter(t => t.module === targetModule);
        const defaultDef = availableInModule[0] || DNIT_TEST_CATALOG[0];

        const defaultBatch = order?.batch || `L${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 900 + 100)}`;
        const defaultProduct = order?.productName || (targetModule === 'asfalto' ? 'Concreto Asfáltico CBUQ Faixa C' : targetModule === 'concreto' ? 'Concreto Usinado Estrutural fck 30 MPa' : 'Agregado Britado 19mm');

        setDnitForm({
            module: targetModule,
            selectedTestId: defaultDef.id,
            orderId: order?.id || '', // Totalmente opcional
            batchNumber: defaultBatch,
            sampleType: defaultProduct,
            locationOrStation: '',
            supplierOrQuarry: '',
            tester: 'Laboratorista Técnico Especialista',
            supervisor: 'Eng. Responsável Técnico - CREA 198420-D',
            testedAt: new Date().toISOString().split('T')[0],
            resultValue: '',
            status: 'Aprovado',
            conditionalRelease: false,
            notes: '',
            isBenchExpanded: true,
            benchValues: {}
        });
        setIsDNITModalOpen(true);
    };

    const handleSaveDNITTest = (e: React.FormEvent) => {
        e.preventDefault();
        const def = activeTestDef;
        const relatedOrder = dnitForm.orderId ? productionOrders.find(o => o.id === dnitForm.orderId) : undefined;
        const relatedUnit = relatedOrder ? productionUnits.find(u => u.id === relatedOrder.unitId) : undefined;

        const effectiveStatus = (dnitForm.status === 'Reprovado' && dnitForm.conditionalRelease)
            ? 'Ressalva'
            : dnitForm.status;

        const newLabTestRecord: DNITLabTest = {
            id: `dnit-${Date.now()}`,
            module: def.module,
            testCode: def.code,
            testName: def.name,
            standardNorm: def.norm,
            sampleType: dnitForm.sampleType || def.sampleType,
            batchNumber: dnitForm.batchNumber,
            orderId: dnitForm.orderId || undefined,
            orderNumber: relatedOrder?.orderNumber,
            productName: relatedOrder?.productName || dnitForm.sampleType || 'Material Padronizado DNIT',
            unitId: relatedOrder?.unitId,
            unitName: relatedUnit?.name || 'Central de Usinagem Principal',
            locationOrStation: dnitForm.locationOrStation || undefined,
            supplierOrQuarry: dnitForm.supplierOrQuarry || undefined,
            testedAt: dnitForm.testedAt,
            tester: dnitForm.tester,
            supervisor: dnitForm.supervisor,
            nominalExpected: def.nominalExpected,
            resultValue: dnitForm.resultValue || 'Conforme especificado em bancada',
            status: effectiveStatus,
            conditionalRelease: dnitForm.conditionalRelease,
            notes: dnitForm.notes,
            benchData: dnitForm.benchValues
        };

        // Salva no repositório de testes do laboratório (independente ou vinculado)
        setLabTests(prev => [newLabTestRecord, ...prev]);

        // Se o usuário optou por vincular a uma O.P. existente, alimenta também o qualityTests da ordem no AppContext
        if (dnitForm.orderId) {
            const standardQualityTest: QualityTest = {
                id: newLabTestRecord.id,
                type: `${def.code} - ${def.name}`,
                result: newLabTestRecord.resultValue,
                minExpected: def.nominalExpected,
                status: effectiveStatus === 'Ressalva' ? 'Aprovado' : effectiveStatus,
                testedAt: dnitForm.testedAt,
                tester: dnitForm.tester
            };
            addQualityTest(dnitForm.orderId, standardQualityTest);
        }

        addToast(`Ensaio ${def.code} registrado com sucesso no módulo ${def.module.toUpperCase()}!`, 'success');
        setIsDNITModalOpen(false);
    };

    const handleDeleteLabTest = (testId: string) => {
        if (window.confirm("Confirma a exclusão deste registro técnico de ensaio do laboratório?")) {
            setLabTests(prev => prev.filter(t => t.id !== testId));
            addToast("Ensaio removido do registro laboratorial.", 'info');
        }
    };

    const handlePrintLabReport = (test: DNITLabTest) => {
        const html = generateLabReportHtml(test);
        printDocument(`Laudo_Tecnico_${test.testCode}_${test.batchNumber}`, html, { orientation: 'portrait' });
    };

    const handleExportLabCSV = () => {
        const rows = labTests.map(t => ({
            'ID Laudo': t.id,
            'Módulo': t.module.toUpperCase(),
            'Código Ensaio': t.testCode,
            'Nome do Ensaio': t.testName,
            'Norma Regulamentadora': t.standardNorm,
            'Material / Amostra': t.sampleType,
            'Lote / Batelada': t.batchNumber,
            'O.P.': t.orderNumber || 'Avulso',
            'Data': t.testedAt,
            'Laboratorista': t.tester,
            'Responsável Técnico': t.supervisor,
            'Resultado': t.resultValue,
            'Status': t.status,
            'Liberação Condicional': t.conditionalRelease ? 'Sim' : 'Não',
            'Parecer': t.notes || ''
        }));
        exportToCSV(rows, `Ensaios_Laboratorio_DNIT_${selectedLabModule}`);
        addToast("Dados de ensaios exportados para CSV com sucesso!", 'success');
    };

    const [formulaForm, setFormulaForm] = useState<Partial<ProductionFormula>>({
        type: 'Composicao',
        ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }],
        outputs: [{ productId: '', name: '', percentage: 0 }]
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const calculateFormulaCost = (formula: ProductionFormula) => {
        if (!formula.ingredients || formula.ingredients.length === 0) return 0;
        return formula.ingredients.reduce((total, ing) => {
            const stockItem = inventory.find(i => i.id === ing.productId);
            const unitCost = stockItem?.costPrice ?? stockItem?.price ?? 0;
            return total + (ing.qty * unitCost);
        }, 0);
    };

    const handleSaveOrder = (e: React.FormEvent) => {
        e.preventDefault();
        const formula = formulas.find(f => f.id === newOrder.formulaId);
        const order: ProductionOrder = {
            id: Date.now().toString(),
            orderNumber: `OP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            productName: formula?.name || 'Produto Industrial',
            productId: formula?.outputProductId,
            formulaId: newOrder.formulaId,
            quantity: newOrder.quantity || 0,
            status: 'Planejado',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: newOrder.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: newOrder.priority || 'Média',
            progress: 0,
            unitId: newOrder.unitId,
            batch: newOrder.batch,
            operator: newOrder.operator,
            qualityTests: []
        };
        addProductionOrder(order);
        addToast(`Ordem de Produção #${order.orderNumber} emitida com sucesso!`, 'success');
        setIsOrderModalOpen(false);
    };

    const handleStartOrder = (order: ProductionOrder) => {
        const shortageCheck = checkFormulaStockShortage(order, formulas, inventory);
        if (shortageCheck.hasShortage) {
            const details = shortageCheck.shortages
                .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                .join('\n');
            addToast(
                `Início de produção bloqueado! Saldo insuficiente no estoque:\n${details}`,
                'error',
                8000
            );
            return false;
        }

        startProduction(order.id);
        addToast(`Produção iniciada para OP #${order.orderNumber}!`, 'success');
        return true;
    };

    const handleUpdateExistingOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        const currentOrder = productionOrders.find(o => o.id === editingOrder.id);
        if (editingOrder.status === 'Em Produção' && currentOrder?.status !== 'Em Produção' && !currentOrder?.rawMaterialsDeducted) {
            const shortageCheck = checkFormulaStockShortage(editingOrder, formulas, inventory);
            if (shortageCheck.hasShortage) {
                const details = shortageCheck.shortages
                    .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                    .join('\n');
                addToast(
                    `Início de produção bloqueado! Saldo insuficiente no estoque:\n${details}`,
                    'error',
                    8000
                );
                return;
            }
        }

        updateProductionOrder(editingOrder);
        addToast(`Ordem #${editingOrder.orderNumber} atualizada!`, 'success');
        setIsEditOrderModalOpen(false);
        setEditingOrder(null);
    };

    const handleAddTest = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (selectedOrder) {
            const isConcreto = selectedOrder.productName?.toLowerCase().includes('concreto');
            handleOpenNewTestModal(isConcreto ? 'concreto' : 'asfalto', selectedOrder);
        }
    };

    const handleSaveUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            if (productionUnits.some(u => u.id === editingUnit.id)) {
                updateProductionUnit(editingUnit);
                addToast("Unidade fabril atualizada!", 'success');
            } else {
                addProductionUnit({ ...editingUnit, id: Date.now().toString() });
                addToast("Nova unidade fabril cadastrada!", 'success');
            }
            setIsUnitModalOpen(false);
            setEditingUnit(null);
        }
    };

    const handleSaveFormula = (e: React.FormEvent) => {
        e.preventDefault();
        const formula: ProductionFormula = {
            id: editingFormula?.id || Date.now().toString(),
            name: formulaForm.name || '',
            category: formulaForm.category || 'Concreto',
            type: formulaForm.type || 'Composicao',
            outputProductId: formulaForm.outputProductId || 'p1',
            ingredients: formulaForm.ingredients || [],
            outputs: formulaForm.outputs || []
        } as ProductionFormula;

        if (editingFormula) {
            updateFormula(formula);
            addToast("Traço/Fórmula atualizado com sucesso!", 'success');
        } else {
            addFormula(formula);
            addToast("Novo traço cadastrado com sucesso!", 'success');
        }
        setIsFormulaModalOpen(false);
        setEditingFormula(null);
        setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
    };

    const handleDuplicateFormula = (formula: ProductionFormula) => {
        const cloned: ProductionFormula = {
            ...formula,
            id: Date.now().toString(),
            name: `${formula.name} (Cópia)`,
            ingredients: formula.ingredients.map(ing => ({ ...ing })),
            outputs: formula.outputs ? formula.outputs.map(out => ({ ...out })) : undefined
        };
        addFormula(cloned);
        addToast(`Cópia do traço "${formula.name}" criada com sucesso!`, 'success');
    };

    const addIngredient = () => {
        setFormulaForm(prev => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), { productId: '', name: '', qty: 0, unit: 'kg' }]
        }));
    };

    const addOutput = () => {
        setFormulaForm(prev => ({
            ...prev,
            outputs: [...(prev.outputs || []), { productId: '', name: '', percentage: 0 }]
        }));
    };

    const handlePauseOrder = (order: ProductionOrder) => {
        updateProductionOrder({ ...order, status: 'Pausado' });
        addToast(`O.P. #${order.orderNumber} pausada.`, 'warning');
    };

    const handleResumeOrder = (order: ProductionOrder) => {
        if (!order.rawMaterialsDeducted) {
            const shortageCheck = checkFormulaStockShortage(order, formulas, inventory);
            if (shortageCheck.hasShortage) {
                const details = shortageCheck.shortages
                    .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                    .join('\n');
                addToast(
                    `Retomada bloqueada! Saldo insuficiente no estoque:\n${details}`,
                    'error',
                    8000
                );
                return;
            }
        }
        updateProductionOrder({ ...order, status: 'Em Produção' });
        addToast(`O.P. #${order.orderNumber} retomada.`, 'info');
    };

    const handleCancelOrder = (order: ProductionOrder) => {
        addToast(`Deseja cancelar a O.P. #${order.orderNumber}?`, 'warning', 6000, {
            label: 'CANCELAR O.P.',
            onClick: () => {
                updateProductionOrder({ ...order, status: 'Cancelado' });
                addToast(`O.P. #${order.orderNumber} cancelada.`, 'error');
            }
        });
    };

    const handleProgressIncrement = (order: ProductionOrder, delta: number) => {
        const nextProgress = Math.min(100, Math.max(0, order.progress + delta));
        updateProductionOrder({ ...order, progress: nextProgress });
        if (nextProgress === 100 && order.status !== 'Finalizado') {
            addToast(`O.P. #${order.orderNumber} atingiu 100%! Pode ser finalizada.`, 'info');
        }
    };

    const handleExportOrders = () => {
        const dataToExport = filteredOrders.map(o => ({
            'Numero OP': o.orderNumber,
            'Produto': o.productName,
            'Lote': o.batch || '-',
            'Quantidade': o.quantity,
            'Status': o.status,
            'Prioridade': o.priority,
            'Progresso': `${o.progress}%`,
            'Data Inicio': o.startDate,
            'Previsao Entrega': o.dueDate,
            'Operador': o.operator || 'Nao informado',
            'Unidade': productionUnits.find(u => u.id === o.unitId)?.name || o.unitId || '-'
        }));
        exportToCSV(dataToExport, 'Ordens_Producao_PCP');
        addToast("Relatório de Ordens de Produção exportado!", 'success');
    };

    const handlePrintFormulaSheet = (formula: ProductionFormula) => {
        const cost = calculateFormulaCost(formula);
        const html = `
            <div class="header">
                <div class="company-info">
                    <h1 style="color: #4f46e5; margin:0; font-size:24px;">INFRACORE PCP INDUSTRIAL</h1>
                    <p style="margin:2px 0; color:#64748b; font-size:12px;">Ficha Técnica de Traço e Especificação de Dosagem</p>
                </div>
                <div class="doc-info" style="text-align: right;">
                    <h2 style="margin:0; font-size:16px;">TRAÇO INDUSTRIAL</h2>
                    <p style="margin:2px 0; font-size:12px;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin:0; font-size:16px; font-weight:bold; color:#1e293b;">NOME: ${formula.name.toUpperCase()}</p>
                <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Categoria: <strong>${formula.category}</strong> | Tipo: <strong>${formula.type || 'Composição'}</strong> | Custo Estimado: <strong>${formatCurrency(cost)} / UN</strong></p>
            </div>

            <h3 style="font-size:12px; text-transform:uppercase; color:#475569; border-bottom:2px solid #e2e8f0; padding-bottom:6px;">Composição Nominal dos Insumos (Por Unidade)</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <thead>
                    <tr style="background:#f1f5f9; text-align:left; font-size:11px; text-transform:uppercase; color:#475569;">
                        <th style="padding:8px; border:1px solid #cbd5e1;">Insumo / Matéria-Prima</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">Dosagem Unitária</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">Unidade</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">Custo Aprox.</th>
                    </tr>
                </thead>
                <tbody>
                    ${formula.ingredients.map(ing => {
                        const itm = inventory.find(i => i.id === ing.productId);
                        const c = (itm?.costPrice ?? itm?.price ?? 0) * ing.qty;
                        return `
                            <tr style="font-size:12px; border-bottom:1px solid #e2e8f0;">
                                <td style="padding:8px; border:1px solid #cbd5e1;"><strong>${ing.name}</strong></td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${ing.qty}</td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${ing.unit}</td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:right;">${formatCurrency(c)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding-top: 20px;">
                <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Engenheiro / Tecnologista Responsável</div>
                <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Operador da Usina / Balança</div>
            </div>
        `;
        printDocument(`Ficha_Traco_${formula.name.replace(/\s+/g, '_')}`, html);
    };

    const filteredOrders = useMemo(() => {
        return productionOrders.filter(o => {
            const matchesSearch = !orderSearch.trim() ||
                o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                o.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                (o.batch && o.batch.toLowerCase().includes(orderSearch.toLowerCase())) ||
                (o.operator && o.operator.toLowerCase().includes(orderSearch.toLowerCase()));

            const matchesStatus = orderStatusFilter === 'Todos' || o.status === orderStatusFilter;
            const matchesPriority = orderPriorityFilter === 'Todas' || o.priority === orderPriorityFilter;
            const matchesUnit = orderUnitFilter === 'Todas' || o.unitId === orderUnitFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesUnit;
        });
    }, [productionOrders, orderSearch, orderStatusFilter, orderPriorityFilter, orderUnitFilter]);

    const filteredFormulas = useMemo(() => {
        return formulas.filter(f => {
            const matchesSearch = !formulaSearch.trim() ||
                f.name.toLowerCase().includes(formulaSearch.toLowerCase()) ||
                f.ingredients.some(ing => ing.name.toLowerCase().includes(formulaSearch.toLowerCase()));

            const matchesCategory = formulaCategoryFilter === 'Todas' || f.category === formulaCategoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [formulas, formulaSearch, formulaCategoryFilter]);

    const formulaCategories = useMemo(() => {
        const cats = new Set<string>();
        formulas.forEach(f => { if (f.category) cats.add(f.category); });
        return ['Todas', ...Array.from(cats)];
    }, [formulas]);

    const chartData = useMemo(() => {
        const getDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dateStr);
        };

        const last12Months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            return {
                month: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
                fullDate: d
            };
        });

        return last12Months.map(time => {
            const volume = productionOrders
                .filter(o => {
                    const d = getDate(o.startDate);
                    return d.getMonth() === time.monthIndex && d.getFullYear() === time.year;
                })
                .reduce((acc, curr) => acc + curr.quantity, 0);

            return {
                name: `${time.month}/${time.year.toString().slice(2)}`,
                Produção: volume,
                Meta: 2000
            };
        });
    }, [productionOrders]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
                            <Factory size={26} />
                        </div>
                        PCP & Chão de Fábrica
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        Planejamento, Controle da Produção, Dosagem de Traços e Operação de Usinas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
                        <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'monitor' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>MONITORAMENTO</button>
                        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ORDENS (O.P.)</button>
                        <button onClick={() => setActiveTab('formulas')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'formulas' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>TRAÇOS & DOSAGEM</button>
                        <button onClick={() => setActiveTab('lab')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'lab' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>LABORATÓRIO</button>
                    </div>

                    <button
                        onClick={() => {
                            setEditingUnit({ id: '', name: '', type: 'Britagem', status: 'Operando', capacity: '100 ton/h', currentLoad: 0, temp: 45, power: '120 kW' });
                            setIsUnitModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow hover:bg-slate-900 transition-all flex items-center gap-2 text-xs uppercase"
                    >
                        <Plus size={16} /> Nova Usina
                    </button>
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase shadow-indigo-600/30"
                    >
                        <Plus size={16} /> Nova O.P.
                    </button>
                </div>
            </div>

            {/* TAB: MONITORAMENTO (CLEAN & DIRECT) */}
            {activeTab === 'monitor' && (
                <div className="space-y-6">
                    {/* Plant Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {productionUnits.map(unit => {
                            const activeOrder = productionOrders.find(o => o.unitId === unit.id && o.status === 'Em Produção');
                            return (
                                <div key={unit.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${unit.status === 'Operando' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} shadow-sm`}>
                                            <Factory size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${unit.status === 'Operando' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {unit.status.toUpperCase()}
                                            </span>
                                            <button
                                                onClick={() => { setEditingUnit(unit); setIsUnitModalOpen(true); }}
                                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Configurar Planta"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm mb-1">{unit.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Tipo: <strong className="text-slate-600 dark:text-slate-300">{unit.type}</strong> • Cap: {unit.capacity}</p>

                                    {activeOrder ? (
                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[9px] font-bold text-indigo-600 uppercase">OP: {activeOrder.orderNumber}</span>
                                                <span className="text-[10px] font-bold text-indigo-700">{activeOrder.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${activeOrder.progress}%` }}></div>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate">{activeOrder.productName}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center h-16 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Aguardando Carga</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t dark:border-slate-700 text-slate-500">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Thermometer size={14} className="text-orange-400" />
                                            <span>{unit.temp}°C</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Zap size={14} className="text-amber-400" />
                                            <span>{unit.power}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Historical Production Chart (Clean Full Width) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                                Volume de Produção Consolidado (Últimos 12 Meses)
                            </h3>
                            <div className="flex gap-4 text-[10px] font-bold uppercase">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span> Realizado</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full"></span> Meta</span>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="Produção" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={26} />
                                    <Bar dataKey="Meta" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={26} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ORDENS DE PRODUÇÃO (O.P.) */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {/* Filters & Export Bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar OP, produto, lote ou operador..."
                                value={orderSearch}
                                onChange={e => setOrderSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <select
                                value={orderStatusFilter}
                                onChange={e => setOrderStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todos">Status: Todos</option>
                                <option value="Planejado">Planejado</option>
                                <option value="Em Produção">Em Produção</option>
                                <option value="Qualidade">Qualidade</option>
                                <option value="Pausado">Pausado</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>

                            <select
                                value={orderPriorityFilter}
                                onChange={e => setOrderPriorityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todas">Prioridade: Todas</option>
                                <option value="Alta">Alta</option>
                                <option value="Média">Média</option>
                                <option value="Baixa">Baixa</option>
                            </select>

                            <select
                                value={orderUnitFilter}
                                onChange={e => setOrderUnitFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todas">Usinas: Todas</option>
                                {productionUnits.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportOrders}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3.5">Status / OP</th>
                                        <th className="px-6 py-3.5">Produto / Lote</th>
                                        <th className="px-6 py-3.5">Prioridade / Prazos</th>
                                        <th className="px-6 py-3.5">Operador / Usina</th>
                                        <th className="px-6 py-3.5 text-center">Progresso</th>
                                        <th className="px-6 py-3.5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {filteredOrders.map(o => (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                        o.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' :
                                                        o.status === 'Em Produção' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                                                        o.status === 'Qualidade' ? 'bg-amber-100 text-amber-700' :
                                                        o.status === 'Pausado' ? 'bg-orange-100 text-orange-700' :
                                                        o.status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <Circle size={6} fill="currentColor" /> {o.status}
                                                    </span>
                                                    {o.status === 'Planejado' && checkFormulaStockShortage(o, formulas, inventory).hasShortage && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            Sem Estoque
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">#{o.orderNumber}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase">{o.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                                    <span>{o.quantity.toLocaleString()} UN</span>
                                                    <span>• Lote: {o.batch || '-'}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-0.5 ${
                                                    o.priority === 'Alta' ? 'bg-rose-100 text-rose-700' :
                                                    o.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {o.priority}
                                                </span>
                                                <p className="text-[10px] text-slate-400">Entrega: {o.dueDate || o.startDate}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{o.operator || 'Operador Padrão'}</p>
                                                <p className="text-[10px] text-slate-400">{productionUnits.find(u => u.id === o.unitId)?.name || 'Usina'}</p>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="w-24 mx-auto bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${o.status === 'Finalizado' ? 'bg-emerald-500' : o.status === 'Pausado' ? 'bg-orange-400' : 'bg-indigo-600'}`}
                                                        style={{ width: `${o.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1 block">{o.progress}%</span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    {o.status === 'Planejado' && (() => {
                                                        const shortage = checkFormulaStockShortage(o, formulas, inventory);
                                                        if (shortage.hasShortage) {
                                                            return (
                                                                <button
                                                                    onClick={() => handleStartOrder(o)}
                                                                    className="p-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-200 transition-colors"
                                                                    title={`Início Bloqueado: Insumos insuficientes (${shortage.shortages.map(s => s.ingredientName).join(', ')})`}
                                                                >
                                                                    <AlertTriangle size={14} />
                                                                </button>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                onClick={() => handleStartOrder(o)}
                                                                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                                                                title="Iniciar Produção"
                                                            >
                                                                <Play size={14} />
                                                            </button>
                                                        );
                                                    })()}

                                                    {o.status === 'Em Produção' && (
                                                        <>
                                                            <button
                                                                onClick={() => handlePauseOrder(o)}
                                                                className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                                                title="Pausar"
                                                            >
                                                                <Pause size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => { updateProductionOrder({ ...o, status: 'Qualidade', progress: 90 }); addToast(`OP #${o.orderNumber} em Qualidade!`, 'info'); }}
                                                                className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                                                title="Enviar p/ Qualidade"
                                                            >
                                                                <FlaskConical size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {o.status === 'Pausado' && (
                                                        <button
                                                            onClick={() => handleResumeOrder(o)}
                                                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                                                            title="Retomar"
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                    )}

                                                    {o.status === 'Qualidade' && (
                                                        <button
                                                            onClick={() => { completeProduction(o.id); addToast(`OP #${o.orderNumber} concluída!`, 'success'); }}
                                                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                                                            title="Concluir OP"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => { setEditingOrder(o); setIsEditOrderModalOpen(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const formula = formulas.find(f => f.id === o.formulaId);
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(`
                                                                    <html><head><title>OP #${o.orderNumber}</title><style>body{font-family:sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style></head><body>
                                                                    <h2>Ordem de Produção #${o.orderNumber}</h2>
                                                                    <p>Produto: <strong>${o.productName}</strong> | Quantidade: <strong>${o.quantity} UN</strong> | Lote: <strong>${o.batch || '-'}</strong></p>
                                                                    <p>Data: ${o.startDate} | Entrega: ${o.dueDate || o.startDate} | Status: ${o.status}</p>
                                                                    <h3>Insumos do Traço</h3>
                                                                    <table><thead><tr><th>Insumo</th><th>Qtd/UN</th><th>Total Necessário</th></tr></thead><tbody>
                                                                    ${(formula?.ingredients || []).map(i => `<tr><td>${i.name}</td><td>${i.qty} ${i.unit}</td><td><strong>${(i.qty * o.quantity).toFixed(2)} ${i.unit}</strong></td></tr>`).join('')}
                                                                    </tbody></table>
                                                                    <script>window.print();</script></body></html>
                                                                `);
                                                                printWindow.document.close();
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                                        title="Imprimir"
                                                    >
                                                        <Printer size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => { deleteProductionOrder(o.id); addToast(`OP #${o.orderNumber} removida.`, 'warning'); }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic text-xs">
                                                Nenhuma ordem de produção encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TRAÇOS & DOSAGEM */}
            {activeTab === 'formulas' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar traço por nome ou insumo..."
                                value={formulaSearch}
                                onChange={e => setFormulaSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <select
                                value={formulaCategoryFilter}
                                onChange={e => setFormulaCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                {formulaCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    setEditingFormula(null);
                                    setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
                                    setIsFormulaModalOpen(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-1.5 shadow"
                            >
                                <Plus size={14} /> Novo Traço
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFormulas.map(formula => {
                            const unitCost = calculateFormulaCost(formula);

                            return (
                                <div key={formula.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 uppercase">
                                                {formula.category}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-600">
                                                {formatCurrency(unitCost)} <span className="text-[10px] text-slate-400 font-normal">/ UN</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase">{formula.name}</h3>

                                        <div className="space-y-2 mb-6">
                                            {formula.ingredients.map((ing, k) => (
                                                <div key={k} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-700/60 pb-1.5">
                                                    <span className="text-slate-600 dark:text-slate-300">{ing.name}</span>
                                                    <span className="font-bold font-mono text-slate-800 dark:text-white">{ing.qty} {ing.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t dark:border-slate-700 flex gap-2">
                                        <button
                                            onClick={() => { setEditingFormula(formula); setFormulaForm(formula); setIsFormulaModalOpen(true); }}
                                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Edit2 size={13} /> Editar Traço
                                        </button>
                                        <button
                                            onClick={() => handleDuplicateFormula(formula)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Clonar"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            onClick={() => handlePrintFormulaSheet(formula)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Ficha Técnica"
                                        >
                                            <Printer size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: LABORATÓRIO E CONTROLE TECNOLÓGICO DNIT (3 MÓDULOS) */}
            {activeTab === 'lab' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header com Indicadores de Conformidade */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ensaios Registrados</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{labTests.length}</span>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                                    <FlaskConical size={18} />
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Nos 3 módulos laboratoriais</span>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Conformidade</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-emerald-600">
                                    {labTests.length > 0 ? `${Math.round((labTests.filter(t => t.status === 'Aprovado').length / labTests.length) * 100)}%` : '100%'}
                                </span>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                    <CheckCircle size={18} />
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Atendimento pleno às normas DNIT</span>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Liberação Condicional</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-amber-600">
                                    {labTests.filter(t => t.status === 'Ressalva').length}
                                </span>
                                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                                    <AlertTriangle size={18} />
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Liberado com ressalva técnica</span>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Não Conformes</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-rose-600">
                                    {labTests.filter(t => t.status === 'Reprovado').length}
                                </span>
                                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                                    <X size={18} />
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Lotes retidos pelo controle</span>
                        </div>
                    </div>

                    {/* SELETOR DOS 4 MÓDULOS DE ENGENHARIA */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border dark:border-slate-700 w-full md:w-auto gap-1">
                            <button
                                onClick={() => setSelectedLabModule('solos')}
                                className={`flex-1 md:flex-initial px-3.5 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    selectedLabModule === 'solos'
                                        ? 'bg-amber-800 text-white shadow-md shadow-amber-800/20'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Mountain size={15} />
                                SOLOS & GEOTECNIA
                            </button>
                            <button
                                onClick={() => setSelectedLabModule('agregados')}
                                className={`flex-1 md:flex-initial px-3.5 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    selectedLabModule === 'agregados'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Layers size={15} />
                                AGREGADOS & INSUMOS
                            </button>
                            <button
                                onClick={() => setSelectedLabModule('asfalto')}
                                className={`flex-1 md:flex-initial px-3.5 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    selectedLabModule === 'asfalto'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Thermometer size={15} />
                                MASSAS ASFÁLTICAS (CBUQ)
                            </button>
                            <button
                                onClick={() => setSelectedLabModule('concreto')}
                                className={`flex-1 md:flex-initial px-3.5 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    selectedLabModule === 'concreto'
                                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Beaker size={15} />
                                CONCRETO USINADO
                            </button>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={handleExportLabCSV}
                                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase flex items-center gap-1.5 transition-colors"
                                title="Exportar ensaios em CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                            <button
                                onClick={() => handleOpenNewTestModal()}
                                className={`flex-1 md:flex-initial px-5 py-2.5 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
                                    selectedLabModule === 'solos'
                                        ? 'bg-amber-800 hover:bg-amber-900 shadow-amber-800/30'
                                        : selectedLabModule === 'agregados'
                                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                                        : selectedLabModule === 'asfalto'
                                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                                }`}
                            >
                                <Plus size={16} /> Novo Ensaio DNIT
                            </button>
                        </div>
                    </div>

                    {/* Filtros e Busca de Ensaios */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por Lote, Ensaio, O.P. ou Responsável..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                                value={labSearch}
                                onChange={e => setLabSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Conformidade:</span>
                            <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border dark:border-slate-700 text-xs font-bold">
                                {['Todos', 'Aprovado', 'Ressalva', 'Reprovado'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setLabStatusFilter(st)}
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            labStatusFilter === st
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-black'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grade de Ensaios Normativos Registrados */}
                    {(() => {
                        const filtered = labTests
                            .filter(t => t.module === selectedLabModule)
                            .filter(t => labStatusFilter === 'Todos' || t.status === labStatusFilter)
                            .filter(t => {
                                if (!labSearch) return true;
                                const q = labSearch.toLowerCase();
                                return (
                                    t.testName.toLowerCase().includes(q) ||
                                    t.testCode.toLowerCase().includes(q) ||
                                    t.standardNorm.toLowerCase().includes(q) ||
                                    t.batchNumber.toLowerCase().includes(q) ||
                                    (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
                                    t.tester.toLowerCase().includes(q) ||
                                    t.productName.toLowerCase().includes(q)
                                );
                            });

                        if (filtered.length === 0) {
                            return (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <FlaskConical size={32} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 dark:text-white uppercase">Nenhum ensaio localizado</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        Não encontramos registros para o módulo <strong className="uppercase">{selectedLabModule}</strong> com os filtros aplicados.
                                    </p>
                                    <button
                                        onClick={() => handleOpenNewTestModal(selectedLabModule)}
                                        className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase"
                                    >
                                        + Cadastrar Primeiro Ensaio do Módulo
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(test => {
                                    const isApproved = test.status === 'Aprovado';
                                    const isRessalva = test.status === 'Ressalva';

                                    return (
                                        <div
                                            key={test.id}
                                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                                        >
                                            <div>
                                                {/* Header do Card */}
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                            {test.standardNorm}
                                                        </span>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase mt-1 leading-snug">
                                                            {test.testName}
                                                        </h4>
                                                    </div>

                                                    <span
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                                                            isApproved
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                : isRessalva
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        {isApproved && <CheckCircle size={12} />}
                                                        {isRessalva && <AlertTriangle size={12} />}
                                                        {!isApproved && !isRessalva && <X size={12} />}
                                                        {test.status}
                                                    </span>
                                                </div>

                                                {/* Lote e Material */}
                                                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Lote / Batelada:</span>
                                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{test.batchNumber}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Origem:</span>
                                                        <span className="font-bold text-indigo-600 text-right truncate max-w-[180px]">
                                                            {test.orderNumber ? `O.P. #${test.orderNumber}` : 'Recebimento de Insumo'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Material:</span>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-right truncate max-w-[180px]">{test.sampleType}</span>
                                                    </div>
                                                </div>

                                                {/* Resultado do Ensaio */}
                                                <div className="space-y-1 mb-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Resultado Obtido</span>
                                                    <div className="p-2.5 bg-slate-100/70 dark:bg-slate-700/50 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-600">
                                                        {test.resultValue}
                                                    </div>
                                                    <span className="text-[9.5px] text-slate-400 block italic">
                                                        Exigência: {test.nominalExpected}
                                                    </span>
                                                </div>

                                                {test.notes && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-amber-100 dark:border-slate-800 mb-4 line-clamp-2">
                                                        <strong>Parecer:</strong> {test.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Rodapé e Ações do Card */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                                <div className="text-[10px] text-slate-400">
                                                    <span>{test.testedAt}</span> • <span>{test.tester.split(' ')[0]}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setActiveReportTest(test);
                                                            setIsReportModalOpen(true);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                        title="Visualizar e Imprimir Laudo Técnico A4"
                                                    >
                                                        <FileText size={13} /> Laudo
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintLabReport(test)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title="Imprimir direto"
                                                    >
                                                        <Printer size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLabTest(test.id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                                        title="Excluir Ensaio"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {/* Guia Técnico de Referência Normativa do Módulo Ativo */}
                    <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck size={20} className="text-indigo-400" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                Matriz Técnica Normativa DNIT Ativa • Módulo {selectedLabModule.toUpperCase()}
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                            Critérios de aceitação e limites regulatórios aplicados nos ensaios laboratoriais segundo o Manual de Pavimentação do DNIT e normas vigentes.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {DNIT_TEST_CATALOG.filter(t => t.module === selectedLabModule).map(def => (
                                <div key={def.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white text-[11px]">{def.name}</span>
                                        <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">{def.norm}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-2">{def.description}</p>
                                    <div className="text-[9.5px] font-mono text-emerald-400 bg-slate-900/60 p-1.5 rounded">
                                        Critério: {def.nominalExpected}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: NOVA ORDEM DE PRODUÇÃO */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Emitir Ordem de Produção (O.P.)</h3>
                                <p className="text-xs text-slate-500">Programação de batelada para usina fabril.</p>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveOrder} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unidade Fabril / Usina</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.unitId} onChange={e => setNewOrder({ ...newOrder, unitId: e.target.value })} required>
                                    {productionUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Traço / Processo Produtivo</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.formulaId || ''} onChange={e => setNewOrder({ ...newOrder, formulaId: e.target.value })} required>
                                    <option value="">Selecione o traço...</option>
                                    {formulas.map(f => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade Total (UN)</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.quantity || ''} onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })} required min="1" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lote (Batch)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.batch} onChange={e => setNewOrder({ ...newOrder, batch: e.target.value.toUpperCase() })} required />
                                </div>
                            </div>

                            {/* Alerta prévio de estoque para a fórmula selecionada */}
                            {newOrder.formulaId && (() => {
                                const shortageCheck = checkFormulaStockShortage({ formulaId: newOrder.formulaId, quantity: newOrder.quantity }, formulas, inventory);
                                if (shortageCheck.hasShortage) {
                                    return (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                                <span>Atenção: Saldo insuficiente para iniciar imediatamente</span>
                                            </div>
                                            <div className="text-[10px] space-y-0.5 pl-5 opacity-90">
                                                {shortageCheck.shortages.map((s, idx) => (
                                                    <p key={idx}>
                                                        • {s.ingredientName}: necessário {s.requiredQty.toLocaleString('pt-BR')} {s.unit} (disponível: {s.availableQty.toLocaleString('pt-BR')} {s.unit})
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operador Responsável</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" placeholder="Ex: Carlos Santos" value={newOrder.operator || ''} onChange={e => setNewOrder({ ...newOrder, operator: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value as any })}>
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Previsão de Entrega</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                    value={newOrder.dueDate || ''}
                                    onChange={e => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Confirmar e Emitir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: EDITAR O.P. */}
            {isEditOrderModalOpen && editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Editar Ordem #{editingOrder.orderNumber}</h3>
                                <p className="text-xs text-slate-500">Alteração de parâmetros operacionais.</p>
                            </div>
                            <button onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateExistingOrder} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.status}
                                        onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value as any })}
                                    >
                                        <option value="Planejado">Planejado</option>
                                        <option value="Em Produção">Em Produção</option>
                                        <option value="Qualidade">Qualidade</option>
                                        <option value="Pausado">Pausado</option>
                                        <option value="Finalizado">Finalizado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.priority}
                                        onChange={e => setEditingOrder({ ...editingOrder, priority: e.target.value as any })}
                                    >
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.quantity}
                                        onChange={e => setEditingOrder({ ...editingOrder, quantity: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Progresso Físico (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.progress}
                                        onChange={e => setEditingOrder({ ...editingOrder, progress: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operador</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.operator || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, operator: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Limite</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.dueDate || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: TRAÇO / FÓRMULA */}
            {isFormulaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">{editingFormula ? 'Editar Traço' : 'Novo Traço / Fórmula'}</h3>
                                <p className="text-xs text-slate-500">Especificação técnica de componentes.</p>
                            </div>
                            <button onClick={() => setIsFormulaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveFormula} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Traço</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={formulaForm.name || ''} onChange={e => setFormulaForm({ ...formulaForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria</label>
                                    <input type="text" placeholder="Ex: Concreto, Britagem..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={formulaForm.category || ''} onChange={e => setFormulaForm({ ...formulaForm, category: e.target.value })} required />
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Insumos da Mistura</label>
                                    <button type="button" onClick={addIngredient} className="text-indigo-600 text-xs font-bold uppercase flex items-center gap-1">+ Insumo</button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {formulaForm.ingredients?.map((ing, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <select
                                                className="flex-[2] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold"
                                                value={ing.productId}
                                                onChange={e => {
                                                    const newIngs = [...(formulaForm.ingredients || [])];
                                                    const selected = inventory.find(i => i.id === e.target.value);
                                                    newIngs[idx] = { ...ing, productId: e.target.value, name: selected?.name || '', unit: selected?.unit || 'kg' };
                                                    setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                }}
                                                required
                                            >
                                                <option value="">Selecione insumo...</option>
                                                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Qtd"
                                                className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-center"
                                                value={ing.qty}
                                                onChange={e => {
                                                    const newIngs = [...(formulaForm.ingredients || [])];
                                                    newIngs[idx] = { ...ing, qty: Number(e.target.value) };
                                                    setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                }}
                                                required
                                            />
                                            <span className="text-[10px] text-slate-400 w-6">{ing.unit}</span>
                                            <button type="button" onClick={() => setFormulaForm({ ...formulaForm, ingredients: formulaForm.ingredients?.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-rose-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsFormulaModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Traço</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: UNIDADE / USINA */}
            {isUnitModalOpen && editingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Configurar Planta / Usina</h3>
                                <p className="text-xs text-slate-500">Parâmetros operacionais e capacidade nominal.</p>
                            </div>
                            <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Usina</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.name} onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.type} onChange={e => setEditingUnit({ ...editingUnit, type: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacidade</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.capacity} onChange={e => setEditingUnit({ ...editingUnit, capacity: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.status} onChange={e => setEditingUnit({ ...editingUnit, status: e.target.value as any })}>
                                        <option value="Operando">Operando</option>
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Parado">Parado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Planta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ESPECIALIZADO: NOVO ENSAIO NORMATIVO DNIT (MODO HÍBRIDO + BANCADA ASSISTIDA) */}
            {isDNITModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl text-white ${
                                    dnitForm.module === 'solos' ? 'bg-amber-800' : dnitForm.module === 'agregados' ? 'bg-amber-600' : dnitForm.module === 'asfalto' ? 'bg-indigo-600' : 'bg-teal-600'
                                }`}>
                                    {dnitForm.module === 'solos' ? <Mountain size={20} /> : <FlaskConical size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                                        Novo Ensaio Tecnológico • {dnitForm.module.toUpperCase()}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Cadastramento e memorial de bancada sob resolução oficial do DNIT.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsDNITModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDNITTest} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Seleção do Módulo e Ensaio Normativo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Módulo Laboratorial</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.module}
                                        onChange={e => {
                                            const newMod = e.target.value as LabModuleType;
                                            const firstDef = DNIT_TEST_CATALOG.find(t => t.module === newMod) || DNIT_TEST_CATALOG[0];
                                            setDnitForm(prev => ({
                                                ...prev,
                                                module: newMod,
                                                selectedTestId: firstDef.id,
                                                benchValues: {},
                                                resultValue: ''
                                            }));
                                        }}
                                    >
                                        <option value="solos">Solos & Geotecnia Rodoviária (DNIT/DNER)</option>
                                        <option value="agregados">Agregados & Insumos (DNIT/DNER)</option>
                                        <option value="asfalto">Massas Asfálticas / CBUQ (DNIT 031/2006)</option>
                                        <option value="concreto">Concreto Usinado (ABNT / DNIT 049)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ensaio Técnico / Resolução DNIT</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.selectedTestId}
                                        onChange={e => {
                                            const newId = e.target.value;
                                            setDnitForm(prev => ({
                                                ...prev,
                                                selectedTestId: newId,
                                                benchValues: {},
                                                resultValue: ''
                                            }));
                                        }}
                                        required
                                    >
                                        {DNIT_TEST_CATALOG.filter(t => t.module === dnitForm.module).map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.code} • {t.name} ({t.norm})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Banner Informativo do Ensaio Selecionado */}
                            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs">
                                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-indigo-950 dark:text-indigo-200 block uppercase text-[10px]">
                                        Norma de Referência: {activeTestDef.norm}
                                    </span>
                                    <p className="text-indigo-900/80 dark:text-indigo-300/80 text-[11px] mt-0.5">
                                        {activeTestDef.description}
                                    </p>
                                    <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-400 block mt-1">
                                        Critério Normativo: {activeTestDef.nominalExpected}
                                    </span>
                                </div>
                            </div>

                            {/* Vínculo com Ordem de Produção ou Insumo Avulso (TOTALMENTE OPCIONAL) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Vínculo com O.P. (Totalmente Opcional)
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.orderId}
                                        onChange={e => {
                                            const ord = productionOrders.find(o => o.id === e.target.value);
                                            setDnitForm(prev => ({
                                                ...prev,
                                                orderId: e.target.value,
                                                batchNumber: ord?.batch || prev.batchNumber,
                                                sampleType: ord?.productName || prev.sampleType
                                            }));
                                        }}
                                    >
                                        <option value="">Sem vínculo com O.P. (Controle Independente / Jazida / Pilha)</option>
                                        {productionOrders.map(o => (
                                            <option key={o.id} value={o.id}>
                                                Vincular à O.P. #{o.orderNumber} - {o.productName} ({o.batch})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-[9.5px] text-slate-400 mt-1 block">
                                        Não é obrigatório possuir O.P. Ensaios de recepção de carga, pilhas ou pedreiras são autônomos.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Lote / Identificação da Batelada
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold uppercase"
                                        value={dnitForm.batchNumber}
                                        onChange={e => setDnitForm({ ...dnitForm, batchNumber: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="Ex: L1026-CBUQ-01, PILHA-B1-02 ou CARRETA-CAP-18"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Material / Amostra Ensaiada
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.sampleType}
                                        onChange={e => setDnitForm({ ...dnitForm, sampleType: e.target.value })}
                                        required
                                        placeholder={activeTestDef.sampleType}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Trecho / Rodovia / Estaca / Km (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.locationOrStation}
                                        onChange={e => setDnitForm({ ...dnitForm, locationOrStation: e.target.value })}
                                        placeholder="Ex: BR-116, Km 182+400 Pista Sul"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Pedreira / Refinaria / Fornecedor (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.supplierOrQuarry}
                                        onChange={e => setDnitForm({ ...dnitForm, supplierOrQuarry: e.target.value })}
                                        placeholder="Ex: Pedreira Basalto Central / Refinaria REVAP"
                                    />
                                </div>
                            </div>

                            {/* SEÇÃO EXPANSÍVEL: CALCULADOR DE BANCADA & LEITURAS BRUTAS */}
                            <div className="border border-indigo-100 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sliders size={16} className="text-indigo-600" />
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            Calculador de Bancada & Leituras Brutas de Laboratório
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDnitForm({ ...dnitForm, isBenchExpanded: !dnitForm.isBenchExpanded })}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase hover:underline"
                                    >
                                        {dnitForm.isBenchExpanded ? 'Ocultar Bancada' : 'Expandir Bancada'}
                                    </button>
                                </div>

                                {dnitForm.isBenchExpanded && (
                                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                            Insira as medições diretas dos instrumentos. O sistema recalcula os índices e a conformidade normativa instantaneamente.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {activeTestDef.benchFields.map(f => (
                                                <div key={f.key}>
                                                    <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-1">
                                                        {f.label} ({f.unit})
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder={f.placeholder}
                                                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                                        value={dnitForm.benchValues[f.key] ?? ''}
                                                        onChange={e => handleBenchFieldChange(f.key, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RESULTADO CONSOLIDADO E STATUS DE CONFORMIDADE */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Resultado Consolidado do Ensaio
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400"
                                        value={dnitForm.resultValue}
                                        onChange={e => setDnitForm({ ...dnitForm, resultValue: e.target.value })}
                                        required
                                        placeholder="Ex: Teor de Betume: 5,22% | Slump: 9,5 cm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Parecer Normativo
                                    </label>
                                    <select
                                        className={`w-full border rounded-xl p-2.5 text-xs font-black uppercase ${
                                            dnitForm.status === 'Aprovado'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                                                : dnitForm.status === 'Ressalva'
                                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                                                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                                        }`}
                                        value={dnitForm.status}
                                        onChange={e => setDnitForm({ ...dnitForm, status: e.target.value as any })}
                                    >
                                        <option value="Aprovado">Conforme (Aprovado)</option>
                                        <option value="Ressalva">Liberação Condicional (Ressalva)</option>
                                        <option value="Reprovado">Não Conforme (Reprovado)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Liberação Condicional com Ressalva Técnica */}
                            {dnitForm.status === 'Reprovado' && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                                            checked={dnitForm.conditionalRelease}
                                            onChange={e => setDnitForm({ ...dnitForm, conditionalRelease: e.target.checked })}
                                        />
                                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                                            Autorizar Liberação Condicional com Parecer Circunstanciado de Engenharia
                                        </span>
                                    </label>
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 pl-6">
                                        Permite prosseguir com a O.P. registrando no Laudo Oficial a ressalva e as medidas mitigadoras pactuadas pelo RT/CREA.
                                    </p>
                                </div>
                            )}

                            {/* Parecer do Laboratorista */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    Parecer Técnico Circunstanciado / Observações
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium"
                                    value={dnitForm.notes}
                                    onChange={e => setDnitForm({ ...dnitForm, notes: e.target.value })}
                                    placeholder="Descreva particularidades do ensaio, curva granulométrica, calibração da usina ou justificativa de liberação condicional..."
                                />
                            </div>

                            {/* Responsáveis Técnicos e Data */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Laboratorista</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.tester}
                                        onChange={e => setDnitForm({ ...dnitForm, tester: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável Técnico / CREA</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.supervisor}
                                        onChange={e => setDnitForm({ ...dnitForm, supervisor: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data do Ensaio</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={dnitForm.testedAt}
                                        onChange={e => setDnitForm({ ...dnitForm, testedAt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Botões do Modal */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDNITModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30"
                                >
                                    Homologar e Salvar Ensaio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE VISUALIZAÇÃO E EMISSÃO DE LAUDO TÉCNICO FORMAL A4 */}
            {isReportModalOpen && activeReportTest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <FileCheck size={18} className="text-indigo-600" />
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                    Certificado de Ensaio Laboratorial • {activeReportTest.testCode}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePrintLabReport(activeReportTest)}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 shadow"
                                >
                                    <Printer size={14} /> Imprimir Laudo A4 / PDF
                                </button>
                                <button
                                    onClick={() => setIsReportModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Pré-visualização da Folha A4 */}
                        <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-100 dark:bg-slate-950/80">
                            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto text-xs space-y-4">
                                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                                            InfraCore BETA • Controle Tecnológico
                                        </h2>
                                        <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                            Laboratório de Rodovias, Asfalto, Concreto e Agregados
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono font-bold text-indigo-600 block text-xs">
                                            CERTIFICADO #{activeReportTest.id.slice(-8).toUpperCase()}
                                        </span>
                                        <span className="text-[9px] text-slate-400">Data: {activeReportTest.testedAt}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Ensaio / Norma</span>
                                        <span className="font-bold text-slate-900">{activeReportTest.testName}</span>
                                        <span className="text-[10px] text-indigo-600 block font-semibold">{activeReportTest.standardNorm}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Lote & Regime</span>
                                        <span className="font-bold text-slate-900">{activeReportTest.batchNumber}</span>
                                        <span className="text-[10px] text-slate-500 block">
                                            {activeReportTest.orderNumber ? `Ordem de Produção #${activeReportTest.orderNumber}` : 'Controle Independente / Jazida / Pilha'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Localização / Trecho / Estaca</span>
                                        <span className="font-semibold text-slate-800">{activeReportTest.locationOrStation || 'Pátio Industrial / Frente de Obra'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Pedreira / Fornecedor</span>
                                        <span className="font-semibold text-slate-800">{activeReportTest.supplierOrQuarry || 'Produção Interna / Jazida'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Analisado</span>
                                    <div className="font-bold text-slate-800 text-xs">{activeReportTest.sampleType}</div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                                            <tr>
                                                <th className="p-2 border-b">Parâmetro de Controle</th>
                                                <th className="p-2 border-b">Especificação DNIT</th>
                                                <th className="p-2 border-b">Resultado Obtido</th>
                                                <th className="p-2 border-b">Conformidade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-2 font-bold">{activeReportTest.testName}</td>
                                                <td className="p-2 text-slate-600">{activeReportTest.nominalExpected}</td>
                                                <td className="p-2 font-bold font-mono text-indigo-700">{activeReportTest.resultValue}</td>
                                                <td className="p-2 font-black uppercase">
                                                    <span className={activeReportTest.status === 'Aprovado' ? 'text-emerald-600' : activeReportTest.status === 'Ressalva' ? 'text-amber-600' : 'text-rose-600'}>
                                                        {activeReportTest.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {activeReportTest.benchData && Object.keys(activeReportTest.benchData).length > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] space-y-1">
                                        <span className="font-bold text-slate-500 uppercase block text-[9px]">Memória de Bancada & Leituras Brutas:</span>
                                        <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono">
                                            {Object.entries(activeReportTest.benchData).map(([k, v]) => (
                                                <div key={k} className="flex justify-between border-b border-slate-200/60 pb-0.5">
                                                    <span className="text-slate-500">{k.replace(/_/g, ' ')}:</span>
                                                    <span className="font-bold">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                                    <span className="font-bold text-slate-500 uppercase block text-[9px]">Parecer Técnico Conclusivo:</span>
                                    <p className="text-slate-800 italic">
                                        {activeReportTest.notes || 'Ensaio realizado rigorosamente de acordo com os critérios normativos aplicáveis.'}
                                    </p>
                                    {activeReportTest.conditionalRelease && (
                                        <div className="text-amber-700 font-bold text-[10px] pt-1">
                                            [RESSALVA REGISTRADA]: Liberação técnica sob monitoramento em campo autorizada pela supervisão.
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px]">
                                    <div className="border-t border-slate-400 pt-1">
                                        <span className="font-bold block text-slate-900">{activeReportTest.tester}</span>
                                        <span className="text-slate-500 text-[9px]">Laboratorista Responsável</span>
                                    </div>
                                    <div className="border-t border-slate-400 pt-1">
                                        <span className="font-bold block text-slate-900">{activeReportTest.supervisor}</span>
                                        <span className="text-slate-500 text-[9px]">Responsável Técnico / CREA</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between text-[9px] text-slate-400">
                                    <span>InfraCore BETA • Controle Tecnológico</span>
                                    <span>Página 1 de 2 • Continua no Anexo Gráfico abaixo</span>
                                </div>
                            </div>

                            {/* Divisor Visual de Página A4 */}
                            <div className="flex items-center gap-3 my-6 max-w-2xl mx-auto">
                                <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Activity size={12} className="text-indigo-600" />
                                    Página 2 de 2 • Anexo Gráfico Técnico DNIT
                                </span>
                                <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                            </div>

                            {/* Folha 2: Anexo Gráfico & Curvas Normativas */}
                            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto text-xs space-y-4">
                                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                                            InfraCore BETA • Anexo Gráfico & Curvas de Ensaio
                                        </h2>
                                        <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                            Modelagem Gráfica, Curvas Experimentais e Envelopes Normativos DNIT
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono font-bold text-indigo-600 block text-xs">
                                            ANEXO #{activeReportTest.id.slice(-8).toUpperCase()}
                                        </span>
                                        <span className="text-[9px] text-slate-400">Página 2 de 2 • Dossiê Conclusivo</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Ensaio / Norma Vinculada</span>
                                        <span className="font-bold text-slate-900">{activeReportTest.testName}</span>
                                        <span className="text-[10px] text-indigo-600 block font-semibold">{activeReportTest.standardNorm}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Origem & Rastreabilidade</span>
                                        <span className="font-bold text-slate-900">{activeReportTest.batchNumber}</span>
                                        <span className="text-[10px] text-slate-500 block">
                                            {activeReportTest.locationOrStation || 'Pátio Industrial / Frente de Obra'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                        4. Diagrama Normativo DNIT & Modelagem Gráfica de Bancada
                                    </span>
                                    <div 
                                        className="border rounded-lg overflow-hidden bg-slate-50 p-2 flex justify-center items-center shadow-inner"
                                        dangerouslySetInnerHTML={{ __html: generateTestSvgDiagram(activeReportTest) }}
                                    />
                                </div>

                                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[10px] space-y-1">
                                    <span className="font-bold text-slate-500 uppercase block text-[9px]">5. Memória Metodológica & Interpretação da Curva:</span>
                                    <p className="text-slate-700 leading-relaxed">
                                        • Os dados plotados foram derivados diretamente das leituras de bancada obtidas no ensaio sob condições controladas.<br/>
                                        • As curvas e tolerâncias obedecem integralmente aos manuais do DNIT e normas associadas.<br/>
                                        • Instrumentação com rastreabilidade metrológica e certificados de calibração vigentes.
                                    </p>
                                </div>

                                <div className="flex justify-between items-center border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-[10px]">
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Chancela de Autenticidade Metrológica</span>
                                        <span className="font-bold text-slate-800">InfraCore BETA • Controle Tecnológico Digital</span>
                                    </div>
                                    <div className="text-right font-mono text-indigo-700 font-bold text-xs">
                                        SEC-DNIT-{activeReportTest.id.slice(-6).toUpperCase()}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-between text-[9px] text-slate-400">
                                    <span>InfraCore ERP • Engenharia de Produção & Usinas</span>
                                    <span>Página 2 de 2 • Fim do Dossiê Técnico</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;