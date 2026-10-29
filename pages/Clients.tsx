import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Key,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  User,
  Warehouse,
  Badge,
  Package,
  Truck,
  X,
  Edit,
  Trash2,
  Save,
  Paperclip,
  File,
  XCircle,
  ExternalLink,
  Upload,
  Copy,
  AlertTriangle,
  Building,
  CheckCircle,
  RotateCcw,
  Loader2,
  Wrench
,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Client, Supplier, Employee, InventoryItem, FleetVehicle } from '../types';
import { exportToCSV } from '../utils/exportUtils';

// ==========================================
// MÁSCARAS E VALIDAÇÕES DEFENSIVAS BRASILEIRAS
// ==========================================

export const validateCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
};

export const validateCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
};

export const validateCPFOrCNPJ = (doc: string): boolean => {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
};

export const formatCPFOrCNPJ = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatPhone = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export const formatCEP = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '').slice(0, 8);
  return clean.replace(/(\d{5})(\d)/, '$1-$2');
};

export const validatePlate = (plate: string): boolean => {
  if (!plate) return false;
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 7) return false;
  const standardPattern = /^[A-Z]{3}[0-9]{4}$/;
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return standardPattern.test(clean) || mercosulPattern.test(clean);
};

export const getSenatranStateFromPlate = (plate: string): { uf: string; state: string; region: string } | null => {
  const p = (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (p.length < 3) return null;
  const prefix = p.slice(0, 3);

  if (prefix >= 'AAA' && prefix <= 'BEZ') return { uf: 'PR', state: 'Paraná', region: 'Sul' };
  if ((prefix >= 'BFA' && prefix <= 'GKI') || (prefix >= 'QSN' && prefix <= 'QSZ')) return { uf: 'SP', state: 'São Paulo', region: 'Sudeste' };
  if ((prefix >= 'GKM' && prefix <= 'HOK') || (prefix >= 'OPA' && prefix <= 'OZZ') || (prefix >= 'PUA' && prefix <= 'PZZ') || (prefix >= 'QMQ' && prefix <= 'QQZ') || (prefix >= 'QPU' && prefix <= 'QUV') || (prefix >= 'RFA' && prefix <= 'RGD') || (prefix >= 'RMD' && prefix <= 'RND') || (prefix >= 'RTR' && prefix <= 'RUJ')) return { uf: 'MG', state: 'Minas Gerais', region: 'Sudeste' };
  if ((prefix >= 'KMF' && prefix <= 'LVE') || (prefix >= 'RIK' && prefix <= 'RIN') || (prefix >= 'RIP' && prefix <= 'RKS')) return { uf: 'RJ', state: 'Rio de Janeiro', region: 'Sudeste' };
  if ((prefix >= 'JNT' && prefix <= 'JZX') || (prefix >= 'OKS' && prefix <= 'OLM') || (prefix >= 'OUF' && prefix <= 'OVD') || (prefix >= 'OZC' && prefix <= 'OZV') || (prefix >= 'PJA' && prefix <= 'PLZ') || (prefix >= 'RDA' && prefix <= 'RDZ') || (prefix >= 'REK' && prefix <= 'RFA')) return { uf: 'BA', state: 'Bahia', region: 'Nordeste' };
  if ((prefix >= 'IAQ' && prefix <= 'JDO') || (prefix >= 'IVA' && prefix <= 'IVZ') || (prefix >= 'IXA' && prefix <= 'IZZ') || (prefix >= 'JKA' && prefix <= 'JLO') || (prefix >= 'RNE' && prefix <= 'RNZ')) return { uf: 'RS', state: 'Rio Grande do Sul', region: 'Sul' };
  if ((prefix >= 'LVK' && prefix <= 'LWS') || (prefix >= 'OKD' && prefix <= 'OKH') || (prefix >= 'QHA' && prefix <= 'QJZ') || (prefix >= 'QTJ' && prefix <= 'QTM') || (prefix >= 'RAA' && prefix <= 'RAZ') || (prefix >= 'RDS' && prefix <= 'RDX') || (prefix >= 'RKF' && prefix <= 'RKM')) return { uf: 'SC', state: 'Santa Catarina', region: 'Sul' };
  if ((prefix >= 'KAV' && prefix <= 'KFC') || (prefix >= 'NFC' && prefix <= 'NGZ') || (prefix >= 'NJX' && prefix <= 'NLU') || (prefix >= 'NVO' && prefix <= 'NWR') || (prefix >= 'OGH' && prefix <= 'OHA') || (prefix >= 'OOG' && prefix <= 'OOU') || (prefix >= 'PQA' && prefix <= 'PRZ') || (prefix >= 'RBK' && prefix <= 'RCM')) return { uf: 'GO', state: 'Goiás', region: 'Centro-Oeste' };
  if ((prefix >= 'KEA' && prefix <= 'KHF') || (prefix >= 'OYI' && prefix <= 'OZZ') || (prefix >= 'PCA' && prefix <= 'PGZ') || (prefix >= 'QYA' && prefix <= 'QZZ') || (prefix >= 'RDC' && prefix <= 'RDM')) return { uf: 'PE', state: 'Pernambuco', region: 'Nordeste' };
  if ((prefix >= 'HTX' && prefix <= 'HZA') || (prefix >= 'NQZ' && prefix <= 'NRT') || (prefix >= 'NUM' && prefix <= 'NVF') || (prefix >= 'OCH' && prefix <= 'OCI') || (prefix >= 'OCR' && prefix <= 'OEY') || (prefix >= 'OIA' && prefix <= 'OIQ') || (prefix >= 'PFA' && prefix <= 'PFM') || (prefix >= 'PND' && prefix <= 'PPN') || (prefix >= 'RJA' && prefix <= 'RJO') || (prefix >= 'RRS' && prefix <= 'RSC')) return { uf: 'CE', state: 'Ceará', region: 'Nordeste' };
  if ((prefix >= 'HMM' && prefix <= 'HNY') || (prefix >= 'NQH' && prefix <= 'NQI') || (prefix >= 'NRP' && prefix <= 'NRO') || (prefix >= 'OQB' && prefix <= 'OQD') || (prefix >= 'PFF' && prefix <= 'PFI') || (prefix >= 'QFE' && prefix <= 'QFQ') || (prefix >= 'ROA' && prefix <= 'ROZ')) return { uf: 'PB', state: 'Paraíba', region: 'Nordeste' };
  if ((prefix >= 'HQH' && prefix <= 'HTB') || (prefix >= 'NRF' && prefix <= 'NSD') || (prefix >= 'OOG' && prefix <= 'OOU') || (prefix >= 'QAA' && prefix <= 'QAZ') || (prefix >= 'REW' && prefix <= 'REZ')) return { uf: 'MS', state: 'Mato Grosso do Sul', region: 'Centro-Oeste' };
  if ((prefix >= 'JRI' && prefix <= 'JRY') || (prefix >= 'NJW' && prefix <= 'NJX') || (prefix >= 'NPN' && prefix <= 'NQA') || (prefix >= 'OOD' && prefix <= 'OOG') || (prefix >= 'QBA' && prefix <= 'QCZ') || (prefix >= 'RRA' && prefix <= 'RRJ')) return { uf: 'MT', state: 'Mato Grosso', region: 'Centro-Oeste' };
  if ((prefix >= 'JTA' && prefix <= 'JWE') || (prefix >= 'NSE' && prefix <= 'NTC') || (prefix >= 'OBT' && prefix <= 'OCA') || (prefix >= 'OFI' && prefix <= 'OFW') || (prefix >= 'OSW' && prefix <= 'OTZ') || (prefix >= 'QDA' && prefix <= 'QEZ') || (prefix >= 'QVA' && prefix <= 'QVZ') || (prefix >= 'RWK' && prefix <= 'RXD')) return { uf: 'PA', state: 'Pará', region: 'Norte' };
  if ((prefix >= 'MOX' && prefix <= 'MTZ') || (prefix >= 'OCV' && prefix <= 'ODT') || (prefix >= 'OVE' && prefix <= 'OVF') || (prefix >= 'OVH' && prefix <= 'OVL') || (prefix >= 'OYD' && prefix <= 'OYK') || (prefix >= 'PPA' && prefix <= 'PPZ') || (prefix >= 'RBA' && prefix <= 'RBJ') || (prefix >= 'RQE' && prefix <= 'RQP')) return { uf: 'ES', state: 'Espírito Santo', region: 'Sudeste' };
  if ((prefix >= 'JXY' && prefix <= 'JZZ') || (prefix >= 'NOI' && prefix <= 'NPB') || (prefix >= 'OAA' && prefix <= 'OAO') || (prefix >= 'OXM' && prefix <= 'OXM') || (prefix >= 'PHA' && prefix <= 'PHZ') || (prefix >= 'QTA' && prefix <= 'QTJ') || (prefix >= 'RZA' && prefix <= 'RZZ')) return { uf: 'AM', state: 'Amazonas', region: 'Norte' };
  if ((prefix >= 'HPL' && prefix <= 'HQI') || (prefix >= 'NHA' && prefix <= 'NHT') || (prefix >= 'NMP' && prefix <= 'NNI') || (prefix >= 'NWS' && prefix <= 'NXQ') || (prefix >= 'OIR' && prefix <= 'OJQ') || (prefix >= 'OXQ' && prefix <= 'OXZ') || (prefix >= 'PSA' && prefix <= 'PZZ') || (prefix >= 'ROH' && prefix <= 'ROM')) return { uf: 'MA', state: 'Maranhão', region: 'Nordeste' };
  if ((prefix >= 'MXA' && prefix <= 'MZZ') || (prefix >= 'NNJ' && prefix <= 'NOH') || (prefix >= 'OJR' && prefix <= 'OKC') || (prefix >= 'OVZ' && prefix <= 'OWG') || (prefix >= 'QGA' && prefix <= 'QGZ') || (prefix >= 'RGE' && prefix <= 'RGM')) return { uf: 'RN', state: 'Rio Grande do Norte', region: 'Nordeste' };

  return null;
};

export const formatPlate = (plate: string): string => {
  const clean = (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (/^[A-Z]{3}[0-9][A-Z]/.test(clean)) {
    return clean.slice(0, 7);
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
};

// ==========================================
// OPÇÕES E CLASSIFICAÇÃO CONTÁBIL: PLANO DE CONTAS 1.01 (RECEITA OPERACIONAL BRUTA)
// ==========================================
export const PLAN_101_OPTIONS = {
  products: [
    '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    '1.01.02 - Venda de Rachão/Pedra de Mão',
    '1.01.03 - Venda de Concreto Usinado',
    '1.01.05 - Venda de Massa Asfáltica (CBUQ)',
    '1.01.06 - Venda de Emulsão Asfáltica',
    'Outros Produtos e Insumos'
  ],
  services: [
    '1.01.04 - Serviço de Bombeamento de Concreto',
    '1.01.07 - Execução de Obras de Pavimentação',
    '1.01.08 - Obras de Infraestrutura e Terraplenagem',
    '1.01.09 - Obras de Arte Especiais (Pontes/Viadutos)',
    '1.01.10 - Locação de Equipamentos e Maquinário',
    '1.01.11 - Serviços de Laboratório/Tecnológicos',
    'Outros Serviços Operacionais'
  ]
};

export const classifyProductCategory101 = (item: { name?: string; category?: string; description?: string }): string => {
  if (!item) return '1.01.01 - Venda de Agregados (Brita/Areia/Pó)';
  const currentCat = (item.category || '').trim();
  if (currentCat.startsWith('1.01.')) return currentCat;

  const n = (item.name || '').toLowerCase();
  const d = (item.description || '').toLowerCase();
  const c = currentCat.toLowerCase();

  // Teste prioritário de Agregados por Brita / Areia / BGS / Pedrisco / Pó de Pedra
  if (n.startsWith('brita') || n.includes('pedrisco') || n.includes('areia industrial') || n.includes('areia de brita') || n.includes('bgs') || n.includes('pó de pedra') || n.includes('po de pedra') || n.includes('pó de brita') || n.includes('po de brita')) {
    return '1.01.01 - Venda de Agregados (Brita/Areia/Pó)';
  }

  // Rachão / Pedra de Mão
  if (n.includes('rachão') || n.includes('rachao') || n.includes('pedra de mão') || n.includes('pedra de mao') || n.includes('enrocamento')) {
    return '1.01.02 - Venda de Rachão/Pedra de Mão';
  }

  // Concreto Usinado
  if (n.includes('concreto usinado')) {
    return '1.01.03 - Venda de Concreto Usinado';
  }

  // Bombeamento de Concreto
  if (n.includes('bombeamento')) {
    return '1.01.04 - Serviço de Bombeamento de Concreto';
  }

  // CBUQ / Massa Asfáltica
  if (n.includes('cbuq') || n.includes('massa asfáltica') || n.includes('massa asfaltica')) {
    return '1.01.05 - Venda de Massa Asfáltica (CBUQ)';
  }

  // Emulsão Asfáltica
  if (n.includes('emulsão') || n.includes('emulsao')) {
    return '1.01.06 - Venda de Emulsão Asfáltica';
  }

  // Execução de Pavimentação
  if (n.includes('pavimentação') || n.includes('pavimentacao') || n.includes('fresagem') || n.includes('recapeamento') || n.includes('tapa buraco')) {
    return '1.01.07 - Execução de Obras de Pavimentação';
  }

  // Terraplenagem / Infraestrutura
  if (n.includes('terraplenagem') || n.includes('subleito') || n.includes('aterro') || n.includes('regularização') || n.includes('regularizacao')) {
    return '1.01.08 - Obras de Infraestrutura e Terraplenagem';
  }

  // Obras de Arte Especiais
  if (n.includes('obras de arte') || n.includes('pontes') || n.includes('viadutos') || n.includes('galerias') || n.includes('oae')) {
    return '1.01.09 - Obras de Arte Especiais (Pontes/Viadutos)';
  }

  // Locação de Equipamentos
  if (n.includes('locação') || n.includes('locacao')) {
    return '1.01.10 - Locação de Equipamentos e Maquinário';
  }

  // Ensaios / Laboratório
  if (n.includes('ensaio') || n.includes('laboratório') || n.includes('laboratorio')) {
    return '1.01.11 - Serviços de Laboratório/Tecnológicos';
  }

  // Fallback baseado em conteúdo geral
  const full = n + ' ' + d + ' ' + c;
  if (full.includes('locação') || full.includes('locacao')) return '1.01.10 - Locação de Equipamentos e Maquinário';
  if (full.includes('ensaio') || full.includes('nbr 5739') || full.includes('nbr 7182') || full.includes('corpo de prova')) return '1.01.11 - Serviços de Laboratório/Tecnológicos';
  if (full.includes('bombeamento')) return '1.01.04 - Serviço de Bombeamento de Concreto';
  if (full.includes('pavimentação') || full.includes('pavimentacao')) return '1.01.07 - Execução de Obras de Pavimentação';
  if (full.includes('terraplenagem')) return '1.01.08 - Obras de Infraestrutura e Terraplenagem';
  if (full.includes('obras de arte')) return '1.01.09 - Obras de Arte Especiais (Pontes/Viadutos)';
  if (full.includes('rachão') || full.includes('rachao')) return '1.01.02 - Venda de Rachão/Pedra de Mão';
  if (full.includes('concreto usinado') || full.includes('fck')) return '1.01.03 - Venda de Concreto Usinado';
  if (full.includes('cbuq') || full.includes('massa asfáltica')) return '1.01.05 - Venda de Massa Asfáltica (CBUQ)';
  if (full.includes('emulsão') || full.includes('rr-2c') || full.includes('rl-1c')) return '1.01.06 - Venda de Emulsão Asfáltica';
  if (full.includes('brita') || full.includes('areia') || full.includes('agregado')) return '1.01.01 - Venda de Agregados (Brita/Areia/Pó)';

  return currentCat || '1.01.01 - Venda de Agregados (Brita/Areia/Pó)';
};

// ==========================================
// CATÁLOGO CANÔNICO DO PLANO DE CONTAS: ITEM 1.01 (RECEITA OPERACIONAL BRUTA)
// ==========================================
export const PLAN_101_PRODUCTS: Omit<InventoryItem, 'id'>[] = [
  // --- 1.01.01: Venda de Agregados (Brita/Areia/Pó) ---
  {
    name: 'Brita 0 (Pedrisco Limpo 4,8mm - 9,5mm)',
    description: 'Pedrisco limpo de alta densidade para pisos industriais, artefatos de cimento e concreto fino. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 68.00,
    costPrice: 38.00,
    quantity: 250,
    minStock: 50,
    barcode: '7891010100010',
    location: 'Pátio Britagem - Baia 01',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },
  {
    name: 'Brita 1 (19mm - Concreto Estrutural)',
    description: 'Brita graduada 19mm para preparo de concreto usinado estrutural, vigas, pilares e lajes. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 72.00,
    costPrice: 40.00,
    quantity: 400,
    minStock: 80,
    barcode: '7891010100027',
    location: 'Pátio Britagem - Baia 02',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },
  {
    name: 'Brita 2 (25mm - Drenagem e Pavimentação)',
    description: 'Brita grossa 25mm para drenos profundos, sub-base viária e concreto pesado. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 70.00,
    costPrice: 39.00,
    quantity: 350,
    minStock: 60,
    barcode: '7891010100034',
    location: 'Pátio Britagem - Baia 03',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },
  {
    name: 'Brita Graduada Simples (BGS)',
    description: 'Composição dosada de agregados para execução de base e sub-base de pavimentação. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 65.00,
    costPrice: 35.00,
    quantity: 500,
    minStock: 100,
    barcode: '7891010100041',
    location: 'Pátio Britagem - Baia 04',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },
  {
    name: 'Areia Industrial Lavada (Areia de Brita)',
    description: 'Areia manufaturada proveniente de britagem terciária, 100% isenta de argila ou matéria orgânica. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 85.00,
    costPrice: 46.00,
    quantity: 300,
    minStock: 50,
    barcode: '7891010100058',
    location: 'Pátio Britagem - Silo 01',
    brand: 'InfraCore Mineração',
    ncm: '2505.10.00',
    weight: 1000
  },
  {
    name: 'Pó de Pedra / Pó de Brita',
    description: 'Finos de britagem para usinagem de massa asfáltica e assentamento de pavimento intertravado. Código Contábil: 1.01.01',
    category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)',
    unit: 'ton',
    price: 58.00,
    costPrice: 30.00,
    quantity: 450,
    minStock: 80,
    barcode: '7891010100065',
    location: 'Pátio Britagem - Baia 05',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },

  // --- 1.01.02: Venda de Rachão/Pedra de Mão ---
  {
    name: 'Pedra Rachão (Pedra de Mão / Enrocamento)',
    description: 'Pedra bruta de 10cm a 30cm para contenção de encostas, muros de gabião e drenagens. Código Contábil: 1.01.02',
    category: '1.01.02 - Venda de Rachão/Pedra de Mão',
    unit: 'ton',
    price: 62.00,
    costPrice: 32.00,
    quantity: 380,
    minStock: 50,
    barcode: '7891010200017',
    location: 'Pátio Pedreira - Setor A',
    brand: 'InfraCore Mineração',
    ncm: '2517.10.00',
    weight: 1000
  },

  // --- 1.01.03: Venda de Concreto Usinado ---
  {
    name: 'Concreto Usinado FCK 20 MPa (Slump 10±2)',
    description: 'Concreto usinado dosado em central para fundações rasas, sapatas e contrapisos. Código Contábil: 1.01.03',
    category: '1.01.03 - Venda de Concreto Usinado',
    unit: 'm3',
    price: 380.00,
    costPrice: 265.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010300014',
    location: 'Usina Dosadora de Concreto 01',
    brand: 'InfraCore Concreto',
    ncm: '3824.50.00',
    weight: 2400
  },
  {
    name: 'Concreto Usinado FCK 25 MPa (Slump 10±2)',
    description: 'Concreto estrutural normatizado para pilares, vigas e lajes residenciais/comerciais. Código Contábil: 1.01.03',
    category: '1.01.03 - Venda de Concreto Usinado',
    unit: 'm3',
    price: 410.00,
    costPrice: 285.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010300021',
    location: 'Usina Dosadora de Concreto 01',
    brand: 'InfraCore Concreto',
    ncm: '3824.50.00',
    weight: 2400
  },
  {
    name: 'Concreto Usinado FCK 30 MPa Estrutural',
    description: 'Concreto de alta resistência para estruturas pesadas, reservatórios e pilares esbeltos. Código Contábil: 1.01.03',
    category: '1.01.03 - Venda de Concreto Usinado',
    unit: 'm3',
    price: 445.00,
    costPrice: 310.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010300038',
    location: 'Usina Dosadora de Concreto 01',
    brand: 'InfraCore Concreto',
    ncm: '3824.50.00',
    weight: 2400
  },
  {
    name: 'Concreto Usinado FCK 35 MPa (Pisos Industriais)',
    description: 'Concreto de baixo fator água/cimento aditivado com plastificantes para pisos de alta abrasão. Código Contábil: 1.01.03',
    category: '1.01.03 - Venda de Concreto Usinado',
    unit: 'm3',
    price: 485.00,
    costPrice: 340.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010300045',
    location: 'Usina Dosadora de Concreto 01',
    brand: 'InfraCore Concreto',
    ncm: '3824.50.00',
    weight: 2400
  },
  {
    name: 'Concreto Usinado FCK 40 MPa (Alta Resistência / OAE)',
    description: 'Concreto especial de alto desempenho para pontes, viadutos e estruturas pré-moldadas. Código Contábil: 1.01.03',
    category: '1.01.03 - Venda de Concreto Usinado',
    unit: 'm3',
    price: 530.00,
    costPrice: 375.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010300052',
    location: 'Usina Dosadora de Concreto 01',
    brand: 'InfraCore Concreto',
    ncm: '3824.50.00',
    weight: 2400
  },

  // --- 1.01.04: Serviço de Bombeamento de Concreto ---
  {
    name: 'Serviço de Bombeamento de Concreto (Bomba Lança / Estacionária)',
    description: 'Lançamento mecânico e transporte pressurizado de concreto em obras civis e industriais. Código Contábil: 1.01.04',
    category: '1.01.04 - Serviço de Bombeamento de Concreto',
    unit: 'm3',
    price: 45.00,
    costPrice: 22.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010400011',
    location: 'Frentes de Concretagem Externa',
    brand: 'InfraCore Concreto',
    ncm: '9983.99.00'
  },

  // --- 1.01.05: Venda de Massa Asfáltica (CBUQ) ---
  {
    name: 'Massa Asfáltica CBUQ - Capa de Rolamento (Faixa C)',
    description: 'Mistura asfáltica usinada a quente para revestimento final de pistas de tráfego intenso. Código Contábil: 1.01.05',
    category: '1.01.05 - Venda de Massa Asfáltica (CBUQ)',
    unit: 'ton',
    price: 395.00,
    costPrice: 285.00,
    quantity: 80,
    minStock: 20,
    barcode: '7891010500018',
    location: 'Usina de Asfalto - Silo A',
    brand: 'InfraCore Asfalto',
    ncm: '2714.90.00',
    weight: 1000
  },
  {
    name: 'Massa Asfáltica CBUQ - Binder / Ligação (Faixa B)',
    description: 'Camada intermediária de ligação estrutural entre a base e a capa de rolamento. Código Contábil: 1.01.05',
    category: '1.01.05 - Venda de Massa Asfáltica (CBUQ)',
    unit: 'ton',
    price: 370.00,
    costPrice: 265.00,
    quantity: 60,
    minStock: 15,
    barcode: '7891010500025',
    location: 'Usina de Asfalto - Silo B',
    brand: 'InfraCore Asfalto',
    ncm: '2714.90.00',
    weight: 1000
  },
  {
    name: 'Massa Asfáltica CBUQ com Polímero (Alto Tráfego)',
    description: 'CBUQ modificado com polímeros elastoméricos SBS para resistência máxima a deformações plásticas. Código Contábil: 1.01.05',
    category: '1.01.05 - Venda de Massa Asfáltica (CBUQ)',
    unit: 'ton',
    price: 440.00,
    costPrice: 320.00,
    quantity: 40,
    minStock: 10,
    barcode: '7891010500032',
    location: 'Usina de Asfalto - Silo C',
    brand: 'InfraCore Asfalto',
    ncm: '2714.90.00',
    weight: 1000
  },

  // --- 1.01.06: Venda de Emulsão Asfáltica ---
  {
    name: 'Emulsão Asfáltica RR-2C (Pintura de Ligação)',
    description: 'Emulsão catiônica de ruptura rápida para aderência entre camadas asfálticas sobrepostas. Código Contábil: 1.01.06',
    category: '1.01.06 - Venda de Emulsão Asfáltica',
    unit: 'ton',
    price: 3850.00,
    costPrice: 2900.00,
    quantity: 15,
    minStock: 5,
    barcode: '7891010600015',
    location: 'Tanque Estacionário 01',
    brand: 'InfraCore Asfalto',
    ncm: '2714.90.00',
    weight: 1000
  },
  {
    name: 'Emulsão Asfáltica RL-1C (Imprimação Impermeabilizante)',
    description: 'Emulsão catiônica de ruptura lenta com alta penetração em bases granulares de brita. Código Contábil: 1.01.06',
    category: '1.01.06 - Venda de Emulsão Asfáltica',
    unit: 'ton',
    price: 4100.00,
    costPrice: 3150.00,
    quantity: 12,
    minStock: 4,
    barcode: '7891010600022',
    location: 'Tanque Estacionário 02',
    brand: 'InfraCore Asfalto',
    ncm: '2714.90.00',
    weight: 1000
  },

  // --- 1.01.07: Execução de Obras de Pavimentação ---
  {
    name: 'Execução de Pavimentação Asfáltica (Aplicação e Rolagem)',
    description: 'Serviço mecanizado completo com espalhamento por vibroacabadora e rolagem compactadora tandem/pneumática. Código Contábil: 1.01.07',
    category: '1.01.07 - Execução de Obras de Pavimentação',
    unit: 'm2',
    price: 38.00,
    costPrice: 24.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010700012',
    location: 'Frentes de Pavimentação Viária',
    brand: 'InfraCore Engenharia',
    ncm: '9983.99.00'
  },

  // --- 1.01.08: Obras de Infraestrutura e Terraplenagem ---
  {
    name: 'Serviço de Terraplenagem, Corte e Aterro',
    description: 'Desmonte, escavação mecanizada, transporte interno e compactação de aterro controlado. Código Contábil: 1.01.08',
    category: '1.01.08 - Obras de Infraestrutura e Terraplenagem',
    unit: 'm3',
    price: 28.00,
    costPrice: 16.50,
    quantity: 0,
    minStock: 0,
    barcode: '7891010800019',
    location: 'Frentes de Terraplenagem',
    brand: 'InfraCore Engenharia',
    ncm: '9983.99.00'
  },
  {
    name: 'Regularização e Compactação de Subleito / Base',
    description: 'Conformação com motoniveladora e compactação até 100% do Proctor Normal para recebimento de pavimento. Código Contábil: 1.01.08',
    category: '1.01.08 - Obras de Infraestrutura e Terraplenagem',
    unit: 'm2',
    price: 12.50,
    costPrice: 7.20,
    quantity: 0,
    minStock: 0,
    barcode: '7891010800026',
    location: 'Frentes de Terraplenagem',
    brand: 'InfraCore Engenharia',
    ncm: '9983.99.00'
  },

  // --- 1.01.09: Obras de Arte Especiais ---
  {
    name: 'Construção de Obras de Arte Especiais (Pontes, Viadutos e Galerias)',
    description: 'Execução de estruturas pesadas em concreto armado e protendido para transposição de córregos e rodovias. Código Contábil: 1.01.09',
    category: '1.01.09 - Obras de Arte Especiais (Pontes/Viadutos)',
    unit: 'un',
    price: 150000.00,
    costPrice: 98000.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891010900016',
    location: 'Projetos Estruturais OAE',
    brand: 'InfraCore Engenharia',
    ncm: '9983.99.00'
  },

  // --- 1.01.10: Locação de Equipamentos e Maquinário ---
  {
    name: 'Locação de Escavadeira Hidráulica 20t (Hora/Máquina)',
    description: 'Escavadeira hidráulica sobre esteiras 20 toneladas com operador qualificado e horímetro fiscalizado. Código Contábil: 1.01.10',
    category: '1.01.10 - Locação de Equipamentos e Maquinário',
    unit: 'h',
    price: 280.00,
    costPrice: 160.00,
    quantity: 5,
    minStock: 1,
    barcode: '7891011000012',
    location: 'Pátio Central de Frotas',
    brand: 'Caterpillar / Komatsu',
    ncm: '8429.52.00'
  },
  {
    name: 'Locação de Retroescavadeira 4x4 (Hora/Máquina)',
    description: 'Retroescavadeira traçada 4x4 com concha frontal de 1m3 e caçamba escavadeira traseira. Código Contábil: 1.01.10',
    category: '1.01.10 - Locação de Equipamentos e Maquinário',
    unit: 'h',
    price: 190.00,
    costPrice: 110.00,
    quantity: 8,
    minStock: 2,
    barcode: '7891011000029',
    location: 'Pátio Central de Frotas',
    brand: 'JCB / Case',
    ncm: '8429.51.00'
  },
  {
    name: 'Locação de Rolo Compactador Vibratório Pé de Carneiro / Liso (Hora)',
    description: 'Rolo compactador vibratório autopropelido para solos granulares, coesivos e asfalto. Código Contábil: 1.01.10',
    category: '1.01.10 - Locação de Equipamentos e Maquinário',
    unit: 'h',
    price: 220.00,
    costPrice: 130.00,
    quantity: 4,
    minStock: 1,
    barcode: '7891011000036',
    location: 'Pátio Central de Frotas',
    brand: 'Dynapac / Hamm',
    ncm: '8429.40.00'
  },
  {
    name: 'Locação de Caminhão Basculante Caçamba Traçado 6x4 (Hora)',
    description: 'Caminhão basculante traçado 6x4 com caçamba de 14m3 a 16m3 para transporte de terra e brita. Código Contábil: 1.01.10',
    category: '1.01.10 - Locação de Equipamentos e Maquinário',
    unit: 'h',
    price: 210.00,
    costPrice: 125.00,
    quantity: 12,
    minStock: 3,
    barcode: '7891011000043',
    location: 'Pátio Central de Frotas',
    brand: 'Volvo / Scania',
    ncm: '8704.23.10'
  },
  {
    name: 'Locação de Vibroacabadora de Asfalto (Hora/Máquina)',
    description: 'Vibroacabadora sobre esteiras com mesa niveladora telescópica eletrônica para acabamento de CBUQ. Código Contábil: 1.01.10',
    category: '1.01.10 - Locação de Equipamentos e Maquinário',
    unit: 'h',
    price: 450.00,
    costPrice: 270.00,
    quantity: 2,
    minStock: 1,
    barcode: '7891011000050',
    location: 'Pátio Central de Frotas',
    brand: 'Vögele / Ciber',
    ncm: '8479.10.90'
  },

  // --- 1.01.11: Serviços de Laboratório/Tecnológicos ---
  {
    name: 'Ensaio de Rompimento de Corpo de Prova de Concreto (NBR 5739)',
    description: 'Capeamento e determinação da resistência à compressão axial com emissão de curva de evolução FCK. Código Contábil: 1.01.11',
    category: '1.01.11 - Serviços de Laboratório/Tecnológicos',
    unit: 'un',
    price: 45.00,
    costPrice: 18.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891011100019',
    location: 'Laboratório Tecnológico - Asfalto & Concreto',
    brand: 'InfraCore Lab',
    ncm: '9983.99.00'
  },
  {
    name: 'Ensaio de Grau de Compactação e Umidade In Situ (DNIT / NBR 7182)',
    description: 'Ensaio do frasco de areia e determinação da umidade Speedy com cálculo imediato do GC%. Código Contábil: 1.01.11',
    category: '1.01.11 - Serviços de Laboratório/Tecnológicos',
    unit: 'un',
    price: 95.00,
    costPrice: 38.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891011100026',
    location: 'Laboratório Tecnológico - Solos & Terraplenagem',
    brand: 'InfraCore Lab',
    ncm: '9983.99.00'
  },
  {
    name: 'Ensaio de Granulometria de Agregados e Equivalente de Areia',
    description: 'Peneiramento mecânico com módulo de finura, dimensão máxima característica e equivalente de areia. Código Contábil: 1.01.11',
    category: '1.01.11 - Serviços de Laboratório/Tecnológicos',
    unit: 'un',
    price: 120.00,
    costPrice: 45.00,
    quantity: 0,
    minStock: 0,
    barcode: '7891011100033',
    location: 'Laboratório Tecnológico - Agregados & Solos',
    brand: 'InfraCore Lab',
    ncm: '9983.99.00'
  }
];

export const isServiceItem = (item: any): boolean => {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const unit = (item.unit || '').toLowerCase();

  if (cat.includes('serviç') || cat.includes('locaç') || cat.includes('laborat') || cat.includes('engenharia') || cat.includes('ensaio') || cat.includes('mão de obra')) {
    return true;
  }
  if (unit === 'h' || unit === 'hora' || unit === 'diária' || unit === 'mês' || unit === 'serv') {
    return true;
  }
  if (name.startsWith('serviço') || name.startsWith('locação') || name.startsWith('ensaio') || name.startsWith('execução') || name.includes('bombeamento')) {
    return true;
  }
  return false;
};

const Clients = () => {
  const {
    clients, addClient, updateClient, deleteClient,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    employees, addEmployee, updateEmployee, deleteEmployee,
    inventory, addStockItem, updateStockItem, deleteStockItem,
    fleet, addVehicle, updateVehicle, deleteVehicle,
    hasPermission
  } = useApp();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingPlate, setIsLoadingPlate] = useState(false);
  const [isApiTokenModalOpen, setIsApiTokenModalOpen] = useState(false);
  const [apiBrasilToken, setApiBrasilToken] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('infracore_apibrasil_token') || '' : ''));
  const [tempApiToken, setTempApiToken] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('infracore_apibrasil_token') || '';
    }
    return '';
  });

  const handleSaveApiToken = () => {
    try {
      const cleanToken = tempApiToken.trim();
      localStorage.setItem('infracore_apibrasil_token', cleanToken);
      setApiBrasilToken(cleanToken);
      addToast('Token APIBrasil salvo com sucesso!', 'success');
      setIsApiTokenModalOpen(false);
    } catch {
      addToast('Erro ao salvar o token no navegador.', 'error');
    }
  };

  const [apiConfig, setApiConfig] = useState<any>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('infracore_fleet_api_config');
        if (saved) return JSON.parse(saved);
        const legacyToken = localStorage.getItem('infracore_apibrasil_token') || '';
        return { provider: 'auto', apiBrasilToken: legacyToken, wdapiToken: '', fipeApiToken: '' };
      } catch {
        return { provider: 'auto', apiBrasilToken: '', wdapiToken: '', fipeApiToken: '' };
      }
    }
    return { provider: 'auto', apiBrasilToken: '', wdapiToken: '', fipeApiToken: '' };
  });

  const [tempApiConfig, setTempApiConfig] = useState<any>(apiConfig);

  const handleSaveApiConfig = () => {
    try {
      localStorage.setItem('infracore_fleet_api_config', JSON.stringify(tempApiConfig));
      const cleanToken = (tempApiConfig.apiBrasilToken || '').trim();
      if (cleanToken) {
        localStorage.setItem('infracore_apibrasil_token', cleanToken);
        setApiBrasilToken(cleanToken);
      }
      setApiConfig(tempApiConfig);
      addToast('Configurações salvas com sucesso!', 'success');
      setIsApiTokenModalOpen(false);
    } catch {
      addToast('Erro ao salvar as configurações no navegador.', 'error');
    }
  };

  const toInputDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return dateStr.split('T')[0];
    } catch {
      return '';
    }
  };

  const canManage = (type: string) => {
    switch (type) {
      case 'clients': return hasPermission('clients.create') || hasPermission('clients.edit') || hasPermission('clients.manage');
      case 'suppliers': return hasPermission('suppliers.manage') || hasPermission('clients.manage');
      case 'employees': return hasPermission('hr.manage') || hasPermission('employees.manage');
      case 'products':
      case 'services': return hasPermission('inventory.create') || hasPermission('inventory.edit') || hasPermission('inventory.manage');
      case 'vehicles': return hasPermission('fleet.manage');
      default: return false;
    }
  };

  const getInitialFormData = (type: string) => {
    switch (type) {
      case 'clients': return { status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR'), colorClass: 'bg-cyan-100 text-cyan-600', type: 'Matriz' };
      case 'suppliers': return { status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR') };
      case 'employees': return { status: 'Ativo', admissionDate: new Date().toLocaleDateString('pt-BR') };
      case 'products': return { status: 'Ativo', quantity: 0, minStock: 10, price: 0, costPrice: 0, unit: 'ton', category: '1.01.01 - Venda de Agregados (Brita/Areia/Pó)' };
      case 'services': return { status: 'Ativo', quantity: 0, minStock: 0, price: 0, costPrice: 0, unit: 'h', category: '1.01.04 - Serviço de Bombeamento de Concreto' };
      case 'vehicles': return { status: 'Operacional', fuelLevel: 100, lastMaintenance: new Date().toLocaleDateString('pt-BR'), type: 'Carro' };
      default: return {};
    }
  };

  const handleOpenModal = (item?: any, type: string = activeTab) => {
    setActiveTab(type);
    if (item) {
      setEditingId(item.id);
      const initialData = type === 'vehicles' ? { ...item, name: item.model || item.name } : { ...item };
      // Classificação automática em 1.01 se o item possuir categoria legada
      if ((type === 'products' || type === 'services') && (!initialData.category || !initialData.category.startsWith('1.01.'))) {
        initialData.category = classifyProductCategory101(initialData);
      }
      setFormData(initialData);
    } else {
      setEditingId(null);
      setFormData(getInitialFormData(type));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
    setIsLoadingCnpj(false);
    setIsLoadingPlate(false);
  };

  // ==========================================
  // CONSULTA AUTOMÁTICA DE CNPJ (RECEITA FEDERAL / BRASILAPI)
  // ==========================================
  const handleCnpjLookup = async (manualDoc?: string) => {
    const raw = (manualDoc !== undefined ? manualDoc : formData.document || '').replace(/\D/g, '');
    if (!raw) return;

    if (raw.length !== 14) {
      if (manualDoc === undefined) {
        addToast('Para consultar na Receita Federal, informe os 14 dígitos do CNPJ.', 'warning');
      }
      return;
    }

    if (!validateCNPJ(raw)) {
      addToast('CNPJ inválido pelo dígito verificador.', 'error');
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`);
      if (!res.ok) {
        if (res.status === 404) {
          addToast('CNPJ não encontrado na base pública da Receita Federal.', 'error');
        } else {
          addToast(`Instabilidade na consulta da Receita (${res.status}). Você pode preencher manualmente.`, 'warning');
        }
        return;
      }

      const data = await res.json();

      const situacao = (data.descricao_situacao_cadastral || data.situacao_cadastral || '').toUpperCase();
      if (situacao && !situacao.includes('ATIVA')) {
        addToast(`Atenção: Situação cadastral na Receita consta como "${situacao}".`, 'warning', 7000);
      } else {
        addToast('Dados preenchidos com sucesso via Receita Federal!', 'success');
      }

      const cleanPhone = (data.ddd_telefone_1 || '').replace(/\D/g, '');
      const formattedPhone = cleanPhone ? formatPhone(cleanPhone) : '';

      setFormData((prev: any) => ({
        ...prev,
        name: data.razao_social || prev.name || '',
        tradeName: data.nome_fantasia || prev.tradeName || data.razao_social || '',
        phone: formattedPhone || prev.phone || '',
        email: data.email ? data.email.toLowerCase().trim() : (prev.email || ''),
        address: {
          ...(prev.address || {}),
          zipCode: data.cep ? formatCEP(data.cep) : (prev.address?.zipCode || ''),
          street: data.logradouro || prev.address?.street || '',
          number: data.numero || prev.address?.number || '',
          complement: data.complemento || prev.address?.complement || '',
          district: data.bairro || prev.address?.district || '',
          city: data.municipio || prev.address?.city || '',
          state: data.uf || prev.address?.state || ''
        }
      }));
    } catch (err) {
      console.error('Erro ao consultar CNPJ via BrasilAPI:', err);
      addToast('Não foi possível conectar ao serviço da Receita. Prossiga com o preenchimento manual.', 'warning');
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // ==========================================
  // CONSULTA NA BASE NACIONAL DE VEÍCULOS (APIBRASIL - SENATRAN/SINESP)
  // ==========================================
  const mapVehicleType = (modelo: string = '', marca: string = ''): 'Caminhão' | 'Carro' | 'Van' | 'Motocicleta' | 'Máquina' | 'Toco' | 'Truck' | 'Carreta LS' | 'Utilitário' => {
    const t = `${modelo} ${marca}`.toLowerCase();
    if (t.includes('carreta') || t.includes('cavalinho') || t.includes('fh ') || t.includes('scania r') || t.includes('actros') || t.includes('meteor') || t.includes('6x4')) return 'Carreta LS';
    if (t.includes('truck') || t.includes('constellation') || t.includes('tector') || t.includes('cargo') || t.includes('vm ') || t.includes('6x2')) return 'Truck';
    if (t.includes('toco') || t.includes('atego') || t.includes('acello') || t.includes('delivery') || t.includes('4x2')) return 'Toco';
    if (t.includes('escavadeira') || t.includes('retroescavadeira') || t.includes('pá carregadeira') || t.includes('motoniveladora') || t.includes('rolo') || t.includes('cat ') || t.includes('komatsu')) return 'Máquina';
    if (t.includes('strada') || t.includes('hilux') || t.includes('s10') || t.includes('ranger') || t.includes('amarok') || t.includes('fiorino') || t.includes('saveiro') || t.includes('toro') || t.includes('l200')) return 'Utilitário';
    if (t.includes('van') || t.includes('sprinter') || t.includes('ducato') || t.includes('master') || t.includes('transit')) return 'Van';
    if (t.includes('moto') || t.includes('honda') || t.includes('yamaha') || t.includes('cg ') || t.includes('bros')) return 'Motocicleta';
    if (t.includes('caminhão') || t.includes('caminhao') || t.includes('basculante')) return 'Caminhão';
    return 'Caminhão';
  };

  const handlePlateLookup = async (manualPlate?: string) => {
    const rawPlate = (manualPlate !== undefined ? manualPlate : formData.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!rawPlate) {
      addToast('Informe a placa do veículo antes de consultar.', 'warning');
      return;
    }

    if (!validatePlate(rawPlate)) {
      addToast('Formato de placa inválido. Use o padrão tradicional (ABC-1234) ou Mercosul (ABC1D23).', 'error');
      return;
    }

    const token = (apiBrasilToken || apiConfig?.apiBrasilToken || localStorage.getItem('infracore_apibrasil_token') || '').trim();
    if (!token) {
      addToast('Configure o token da APIBrasil no botão de engrenagem ao lado da placa.', 'warning', 6000);
      return;
    }

    setIsLoadingPlate(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let res = await fetch('https://gateway.apibrasil.io/api/v2/vehicles/dados', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ placa: rawPlate })
      });

      if (!res.ok && res.status === 405) {
        res = await fetch(`https://gateway.apibrasil.io/api/v2/vehicles/dados?placa=${rawPlate}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        addToast('Token da APIBrasil inválido ou não autorizado. Verifique seu token no botão de engrenagem.', 'error', 6000);
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          addToast('Placa não encontrada na Base Nacional.', 'error');
        } else {
          addToast(`Erro ao consultar APIBrasil (${res.status}). Preencha os dados manualmente.`, 'warning');
        }
        return;
      }

      const json = await res.json();
      if (json.error) {
        addToast(json.message || 'Veículo não localizado na Base Nacional da APIBrasil.', 'warning');
        return;
      }

      const d = json.dados || json.response || json.veiculo || json;
      const marca = (d.MARCA || d.marca || d.brand || '').trim();
      const modelo = (d.MODELO || d.modelo || d.model || '').trim();
      const submodelo = (d.SUBMODELO || d.submodelo || '').trim();
      const versao = (d.VERSAO || d.versao || '').trim();
      const ano = parseInt(d.ANO_MODELO || d.ano_modelo || d.ANO || d.ano || '0', 10);
      const cor = (d.COR || d.cor || '').trim();
      const chassi = (d.CHASSI || d.chassi || '').trim();
      const renavam = (d.RENAVAM || d.renavam || '').trim();
      const combustivelRaw = (d.COMBUSTIVEL || d.combustivel || '').toLowerCase();
      const situacao = (d.SITUACAO || d.situacao || d.restricao || '').toUpperCase();

      const fullName = modelo || (marca ? `${marca} ${submodelo || versao || rawPlate}` : `Veículo ${rawPlate}`);

      let fuelType: 'Diesel' | 'Gasolina' | 'Etanol' | 'Flex' | 'Elétrico' = 'Diesel';
      if (combustivelRaw.includes('flex')) fuelType = 'Flex';
      else if (combustivelRaw.includes('gasolina')) fuelType = 'Gasolina';
      else if (combustivelRaw.includes('etanol') || combustivelRaw.includes('álcool') || combustivelRaw.includes('alcool')) fuelType = 'Etanol';
      else if (combustivelRaw.includes('elét') || combustivelRaw.includes('elet')) fuelType = 'Elétrico';

      setFormData((prev: any) => ({
        ...prev,
        plate: formatPlate(rawPlate),
        brand: marca || prev.brand || '',
        name: fullName,
        model: submodelo || modelo || fullName,
        year: ano > 1950 ? ano : (prev.year || new Date().getFullYear()),
        type: mapVehicleType(fullName, marca),
        fuelType,
        colorName: cor || prev.colorName || 'Branco',
        color: prev.color || '#ffffff',
        chassis: chassi || prev.chassis || '',
        renavam: renavam || prev.renavam || ''
      }));

      if (situacao && (situacao.includes('ROUBO') || situacao.includes('FURTO') || situacao.includes('RESTRICAO') || situacao.includes('ALIENACAO') || situacao.includes('BAIXAD'))) {
        addToast(`Atenção: Consta apontamento na Base Nacional: "${situacao}"!`, 'warning', 8000);
      } else {
        addToast(`Veículo ${marca} ${fullName} (${ano || 'Base Nacional'}) carregado com sucesso!`, 'success');
      }
    } catch (err: any) {
      console.error('Erro na consulta APIBrasil:', err);
      if (err.name === 'AbortError') {
        addToast('Tempo de resposta da APIBrasil excedido. Tente novamente ou preencha manualmente.', 'warning');
      } else {
        addToast('Falha na comunicação com a APIBrasil. Verifique o token e a conexão.', 'error');
      }
    } finally {
      setIsLoadingPlate(false);
    }
  };

  // ==========================================
  // SALVAR / CARREGAR PRODUTOS E SERVIÇOS DO PLANO DE CONTAS (1.01)
  // ==========================================
  const handleLoadPlan101Products = (scope: 'all' | 'products' | 'services' = 'all', isSilent = false) => {
    let addedCount = 0;
    const targetItems = PLAN_101_PRODUCTS.filter(item => {
      if (scope === 'products') return !isServiceItem(item);
      if (scope === 'services') return isServiceItem(item);
      return true;
    });

    targetItems.forEach((prod, idx) => {
      const alreadyExists = (inventory || []).some(
        p => (p.name || '').trim().toLowerCase() === prod.name.trim().toLowerCase() ||
             (prod.barcode && (p.barcode || '').trim() === prod.barcode.trim())
      );
      if (!alreadyExists) {
        addStockItem({
          ...prod,
          id: `${isServiceItem(prod) ? 'srv' : 'prod'}-101-${idx + 1}-${Date.now()}`
        } as InventoryItem);
        addedCount++;
      }
    });

    const label = scope === 'services' ? 'serviços' : scope === 'products' ? 'produtos' : 'produtos e serviços';
    if (addedCount > 0) {
      addToast(`${addedCount} ${label} derivados do Plano 1.01 salvos com sucesso!`, 'success');
    } else if (!isSilent) {
      addToast('Todos os itens do Plano 1.01 para esta categoria já estão cadastrados.', 'info');
    }
  };

  // Classificação de itens existentes no Plano de Contas 1.01 sem adicionar novos itens
  const handleClassifyProducts101 = (scope: 'all' | 'products' | 'services' = 'all') => {
    let updatedCount = 0;
    (inventory || []).forEach(item => {
      const isSrv = isServiceItem(item);
      if (scope === 'products' && isSrv) return;
      if (scope === 'services' && !isSrv) return;

      const classifiedCat = classifyProductCategory101(item);
      if (item.category !== classifiedCat) {
        updateStockItem({
          ...item,
          category: classifiedCat
        });
        updatedCount++;
      }
    });

    const label = scope === 'services' ? 'serviços' : scope === 'products' ? 'produtos' : 'itens';
    if (updatedCount > 0) {
      addToast(`${updatedCount} ${label} classificados com sucesso no Plano de Contas 1.01!`, 'success');
    } else {
      addToast(`Todos os ${label} já estão classificados no Plano de Contas 1.01.`, 'info');
    }
  };

  // Auto-classificação defensiva de produtos e serviços existentes que ainda não tenham código 1.01
  useEffect(() => {
    if (Array.isArray(inventory) && inventory.length > 0) {
      const needsClassification = inventory.some(item => !item.category || !item.category.trim().startsWith('1.01.'));
      if (needsClassification) {
        inventory.forEach(item => {
          if (!item.category || !item.category.trim().startsWith('1.01.')) {
            const classifiedCat = classifyProductCategory101(item);
            if (classifiedCat !== item.category) {
              updateStockItem({
                ...item,
                category: classifiedCat
              });
            }
          }
        });
      }
    }
  }, [inventory]);

  // Auto-sincronização caso o catálogo esteja vazio ao acessar Produtos ou Serviços
  useEffect(() => {
    if (Array.isArray(inventory) && inventory.length === 0) {
      if (activeTab === 'products' || activeTab === 'services') {
        handleLoadPlan101Products('all', true);
      }
    }
  }, [activeTab, inventory]);

  // ==========================================
  // SALVAR COM VALIDAÇÕES E BLOQUEIO DE DUPLICIDADE
  // ==========================================
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || Date.now().toString();

    // 1. Validação básica obrigatória do Nome / Razão Social
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      addToast(
        activeTab === 'products' ? 'A descrição do produto é obrigatória.' :
        activeTab === 'services' ? 'A descrição do serviço é obrigatória.' :
        activeTab === 'vehicles' ? 'O modelo do veículo é obrigatório.' :
        'O nome ou razão social é obrigatório.',
        'error'
      );
      return;
    }

    // 2. Validações e bloqueios por aba
    if (activeTab === 'clients') {
      const docClean = (formData.document || '').replace(/\D/g, '');
      if (docClean) {
        if (docClean.length !== 11 && docClean.length !== 14) {
          addToast('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.', 'error');
          return;
        }
        if (!validateCPFOrCNPJ(docClean)) {
          addToast('CPF ou CNPJ inválido pelo dígito verificador.', 'error');
          return;
        }
        // Bloqueio de duplicidade em Clientes
        const duplicateClient = (clients || []).find(
          c => c.id !== editingId && (c.document || '').replace(/\D/g, '') === docClean
        );
        if (duplicateClient) {
          addToast(`Bloqueio de Duplicidade: Já existe um cliente com este CPF/CNPJ (${duplicateClient.name}).`, 'error');
          return;
        }
      }

      if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        addToast('E-mail informado possui formato inválido.', 'error');
        return;
      }

      if (formData.creditLimit !== undefined && formData.creditLimit !== null && Number(formData.creditLimit) < 0) {
        addToast('O limite de crédito não pode ser negativo.', 'error');
        return;
      }

      const client: Client = {
        ...formData,
        id,
        name: trimmedName,
        document: formData.document ? formatCPFOrCNPJ(formData.document) : '',
        phone: formData.phone ? formatPhone(formData.phone) : (formData.phone || ''),
        initials: trimmedName.substring(0, 2).toUpperCase()
      };

      try {
        if (editingId) updateClient(client); else addClient(client);
        addToast(editingId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao salvar cliente:', err);
        addToast('Erro ao salvar dados do cliente.', 'error');
        return;
      }
    } else if (activeTab === 'suppliers') {
      const docClean = (formData.document || '').replace(/\D/g, '');
      if (docClean) {
        if (docClean.length !== 11 && docClean.length !== 14) {
          addToast('CNPJ deve possuir 14 dígitos (ou CPF com 11).', 'error');
          return;
        }
        if (!validateCPFOrCNPJ(docClean)) {
          addToast('CNPJ ou CPF inválido pelo dígito verificador.', 'error');
          return;
        }
        // Bloqueio de duplicidade em Fornecedores
        const duplicateSupplier = (suppliers || []).find(
          s => s.id !== editingId && (s.document || '').replace(/\D/g, '') === docClean
        );
        if (duplicateSupplier) {
          addToast(`Bloqueio de Duplicidade: Já existe um fornecedor cadastrado com este CNPJ/CPF (${duplicateSupplier.name}).`, 'error');
          return;
        }
      }

      if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        addToast('E-mail informado possui formato inválido.', 'error');
        return;
      }

      const supplier: Supplier = {
        ...formData,
        id,
        name: trimmedName,
        document: formData.document ? formatCPFOrCNPJ(formData.document) : '',
        phone: formData.phone ? formatPhone(formData.phone) : (formData.phone || ''),
        initials: trimmedName.substring(0, 2).toUpperCase()
      };

      try {
        if (editingId) updateSupplier(supplier); else addSupplier(supplier);
        addToast(editingId ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao salvar fornecedor:', err);
        addToast('Erro ao salvar dados do fornecedor.', 'error');
        return;
      }
    } else if (activeTab === 'employees') {
      const docClean = (formData.document || formData.cpf || '').replace(/\D/g, '');
      if (docClean) {
        if (docClean.length !== 11) {
          addToast('O CPF do colaborador deve possuir exatamente 11 dígitos.', 'error');
          return;
        }
        if (!validateCPF(docClean)) {
          addToast('CPF do colaborador inválido pelo dígito verificador.', 'error');
          return;
        }
        // Bloqueio de duplicidade em Colaboradores
        const duplicateEmployee = (employees || []).find(
          e => e.id !== editingId && ((e.cpf || (e as any).document || '').replace(/\D/g, '') === docClean)
        );
        if (duplicateEmployee) {
          addToast(`Bloqueio de Duplicidade: Já existe um colaborador cadastrado com este CPF (${duplicateEmployee.name}).`, 'error');
          return;
        }
      }

      if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        addToast('E-mail informado possui formato inválido.', 'error');
        return;
      }

      if (formData.salary !== undefined && formData.salary !== null && Number(formData.salary) < 0) {
        addToast('O salário base não pode ser negativo.', 'error');
        return;
      }

      const employee: Employee = {
        ...formData,
        id,
        name: trimmedName,
        cpf: docClean ? formatCPFOrCNPJ(docClean) : undefined,
        phone: formData.phone ? formatPhone(formData.phone) : (formData.phone || ''),
        salary: parseFloat(formData.salary) || 0
      };

      try {
        if (editingId) updateEmployee(employee); else addEmployee(employee);
        addToast(editingId ? 'Colaborador atualizado com sucesso!' : 'Colaborador cadastrado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao salvar colaborador:', err);
        addToast('Erro ao salvar dados do colaborador.', 'error');
        return;
      }
    } else if (activeTab === 'products' || activeTab === 'services') {
      const price = parseFloat(formData.price) || 0;
      const costPrice = parseFloat(formData.costPrice) || 0;
      const quantity = parseFloat(formData.quantity) || 0;
      const minStock = parseFloat(formData.minStock) || 0;

      if (price < 0 || costPrice < 0 || quantity < 0 || minStock < 0) {
        addToast('Preço e estoque não podem possuir valores negativos.', 'error');
        return;
      }

      const barcode = (formData.barcode || '').trim();
      if (barcode) {
        const duplicateBarcode = (inventory || []).find(
          p => p.id !== editingId && (p.barcode || '').trim() === barcode
        );
        if (duplicateBarcode) {
          addToast(`Bloqueio de Duplicidade: Código de barras já cadastrado no item "${duplicateBarcode.name}".`, 'error');
          return;
        }
      }

      const isSrv = activeTab === 'services';
      const item: InventoryItem = {
        ...formData,
        id: editingId || `${isSrv ? 'srv' : 'p'}-${Date.now()}`,
        name: trimmedName,
        category: formData.category || (isSrv ? '1.01.04 - Serviço de Bombeamento de Concreto' : '1.01.01 - Venda de Agregados (Brita/Areia/Pó)'),
        price,
        costPrice,
        quantity: isSrv ? 0 : quantity,
        minStock: isSrv ? 0 : minStock
      };

      try {
        if (editingId) updateStockItem(item); else addStockItem(item);
        addToast(editingId ? `${isSrv ? 'Serviço' : 'Produto'} atualizado com sucesso!` : `${isSrv ? 'Serviço' : 'Produto'} cadastrado com sucesso!`, 'success');
      } catch (err) {
        console.error('Erro ao salvar item:', err);
        addToast(`Erro ao salvar dados do ${isSrv ? 'serviço' : 'produto'}.`, 'error');
        return;
      }
    } else if (activeTab === 'vehicles') {
      const plate = (formData.plate || '').trim().toUpperCase();
      if (!plate) {
        addToast('A placa do veículo é obrigatória.', 'error');
        return;
      }

      const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
      const duplicateVehicle = (fleet || []).find(
        v => v.id !== editingId && (v.plate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate
      );
      if (duplicateVehicle) {
        addToast(`Bloqueio de Duplicidade: Já existe um veículo cadastrado com a placa ${plate}.`, 'error');
        return;
      }

      if (formData.km !== undefined && formData.km !== null && Number(formData.km) < 0) {
        addToast('A quilometragem não pode ser negativa.', 'error');
        return;
      }

      const vehicleName = trimmedName || formData.model || 'Veículo';
      const vehicle: FleetVehicle = {
        ...formData,
        name: vehicleName,
        model: vehicleName,
        plate,
        id: editingId || `v-${Date.now()}`,
        fuelLevel: parseFloat(formData.fuelLevel) || 0,
        km: parseFloat(formData.km) || 0
      };

      try {
        if (editingId) updateVehicle(vehicle); else addVehicle(vehicle);
        addToast(editingId ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao salvar veículo:', err);
        addToast('Erro ao salvar dados do veículo.', 'error');
        return;
      }
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (!canManage(activeTab)) {
      addToast('Você não possui permissão para excluir registros nesta categoria.', 'error');
      return;
    }
    addToast('Tem certeza que deseja excluir este registro?', 'warning', 5000, {
      label: 'EXCLUIR',
      onClick: () => {
        try {
          if (activeTab === 'clients') deleteClient(id);
          else if (activeTab === 'suppliers') deleteSupplier(id);
          else if (activeTab === 'employees') deleteEmployee(id);
          else if (activeTab === 'products' || activeTab === 'services') deleteStockItem(id);
          else if (activeTab === 'vehicles') deleteVehicle(id);
          addToast('Registro excluído com sucesso!', 'success');
        } catch (err) {
          console.error('Erro ao excluir registro:', err);
          addToast('Erro ao excluir registro.', 'error');
        }
      }
    });
  };

  const handleDuplicate = (item: any) => {
    const duplicatedItem = { ...item };
    delete duplicatedItem.id;
    duplicatedItem.name = `${duplicatedItem.name} (Cópia)`;
    if (duplicatedItem.barcode) duplicatedItem.barcode = '';
    if (duplicatedItem.plate) duplicatedItem.plate = '';
    if (duplicatedItem.document) duplicatedItem.document = '';

    setEditingId(null);
    setFormData(duplicatedItem);
    setIsModalOpen(true);
    addToast('Dados copiados para novo cadastro. Altere as informações exclusivas e salve.', 'info');
  };

  const TabButton = ({ id, icon: Icon, label, count }: any) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setSearchTerm('');
        setStatusFilter('all');
      }}
      className={`border-b-2 pb-2 text-sm font-medium flex items-center gap-2 transition-all ${activeTab === id ? 'border-cyan-500 text-cyan-600 font-bold' : 'border-transparent text-gray-400 font-medium'}`}
    >
      <Icon size={18} /> {label}
      {count !== undefined && <span className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full text-[10px] ml-1 font-bold">{count}</span>}
    </button>
  );

  // ==========================================
  // FILTRAGEM CONSISTENTE E DEFENSIVA
  // ==========================================
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTermDigits = term.replace(/\D/g, '');

    if (activeTab === 'clients') {
      if (!Array.isArray(clients)) return [];
      return clients.filter(c => {
        if (!c) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (!term) return true;

        const nameMatch = (c.name || '').toLowerCase().includes(term);
        const tradeMatch = ((c as any).tradeName || '').toLowerCase().includes(term);
        const emailMatch = (c.email || '').toLowerCase().includes(term);
        const phoneMatch = (c.phone || '').includes(term);
        const contactMatch = (c.contactPerson || '').toLowerCase().includes(term);
        const cityMatch = (c.address?.city || '').toLowerCase().includes(term);
        const docFormattedMatch = (c.document || '').toLowerCase().includes(term);
        const docDigitsMatch = cleanTermDigits.length > 0 && (c.document || '').replace(/\D/g, '').includes(cleanTermDigits);

        return nameMatch || tradeMatch || emailMatch || phoneMatch || contactMatch || cityMatch || docFormattedMatch || docDigitsMatch;
      });
    }

    if (activeTab === 'suppliers') {
      if (!Array.isArray(suppliers)) return [];
      return suppliers.filter(s => {
        if (!s) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (!term) return true;

        const nameMatch = (s.name || '').toLowerCase().includes(term);
        const tradeMatch = (s.tradeName || '').toLowerCase().includes(term);
        const emailMatch = (s.email || '').toLowerCase().includes(term);
        const phoneMatch = (s.phone || '').includes(term);
        const categoryMatch = (s.category || '').toLowerCase().includes(term);
        const contactMatch = (s.contactPerson || '').toLowerCase().includes(term);
        const docFormattedMatch = (s.document || '').toLowerCase().includes(term);
        const docDigitsMatch = cleanTermDigits.length > 0 && (s.document || '').replace(/\D/g, '').includes(cleanTermDigits);

        return nameMatch || tradeMatch || emailMatch || phoneMatch || categoryMatch || contactMatch || docFormattedMatch || docDigitsMatch;
      });
    }

    if (activeTab === 'employees') {
      if (!Array.isArray(employees)) return [];
      return employees.filter(e => {
        if (!e) return false;
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        if (!term) return true;

        const nameMatch = (e.name || '').toLowerCase().includes(term);
        const roleMatch = (e.role || '').toLowerCase().includes(term);
        const deptMatch = (e.department || '').toLowerCase().includes(term);
        const emailMatch = (e.email || '').toLowerCase().includes(term);
        const phoneMatch = (e.phone || '').includes(term);
        const docFormattedMatch = (e.cpf || (e as any).document || '').toLowerCase().includes(term);
        const docDigitsMatch = cleanTermDigits.length > 0 && (e.cpf || (e as any).document || '').replace(/\D/g, '').includes(cleanTermDigits);

        return nameMatch || roleMatch || deptMatch || emailMatch || phoneMatch || docFormattedMatch || docDigitsMatch;
      });
    }

    if (activeTab === 'products') {
      if (!Array.isArray(inventory)) return [];
      return inventory
        .filter(p => !isServiceItem(p))
        .filter(p => {
          if (!p) return false;
          if (statusFilter === 'sem_estoque') {
            if ((p.quantity || 0) > 0) return false;
          } else if (statusFilter === 'baixo_estoque') {
            if ((p.quantity || 0) > (p.minStock || 0)) return false;
          } else if (statusFilter === 'com_estoque') {
            if ((p.quantity || 0) <= 0) return false;
          }
          if (!term) return true;

          const nameMatch = (p.name || '').toLowerCase().includes(term);
          const catMatch = (p.category || '').toLowerCase().includes(term);
          const brandMatch = (p.brand || '').toLowerCase().includes(term);
          const barcodeMatch = (p.barcode || '').toLowerCase().includes(term);
          const locationMatch = (p.location || '').toLowerCase().includes(term);

          return nameMatch || catMatch || brandMatch || barcodeMatch || locationMatch;
        });
    }

    if (activeTab === 'services') {
      if (!Array.isArray(inventory)) return [];
      return inventory
        .filter(p => isServiceItem(p))
        .filter(s => {
          if (!s) return false;
          if (statusFilter !== 'all' && (s as any).status !== statusFilter) return false;
          if (!term) return true;

          const nameMatch = (s.name || '').toLowerCase().includes(term);
          const catMatch = (s.category || '').toLowerCase().includes(term);
          const brandMatch = (s.brand || '').toLowerCase().includes(term);
          const barcodeMatch = (s.barcode || '').toLowerCase().includes(term);
          const locationMatch = (s.location || '').toLowerCase().includes(term);
          const descMatch = (s.description || '').toLowerCase().includes(term);

          return nameMatch || catMatch || brandMatch || barcodeMatch || locationMatch || descMatch;
        });
    }

    if (activeTab === 'vehicles') {
      if (!Array.isArray(fleet)) return [];
      return fleet.filter(v => {
        if (!v) return false;
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        if (!term) return true;

        const modelMatch = (v.model || v.name || '').toLowerCase().includes(term);
        const plateMatch = (v.plate || '').toLowerCase().includes(term);
        const plateDigits = cleanTermDigits.length > 0 && (v.plate || '').replace(/[^A-Z0-9]/gi, '').toLowerCase().includes(term.replace(/[^A-Z0-9]/gi, ''));
        const brandMatch = (v.brand || '').toLowerCase().includes(term);
        const typeMatch = (v.type || '').toLowerCase().includes(term);
        const renavamMatch = ((v as any).renavam || '').toLowerCase().includes(term);

        return modelMatch || plateMatch || plateDigits || brandMatch || typeMatch || renavamMatch;
      });
    }

    return [];
  }, [activeTab, clients, suppliers, employees, inventory, fleet, searchTerm, statusFilter]);

  const handleExport = () => {
    if (filteredItems.length === 0) {
      addToast(`Nenhum registro para exportar em ${activeTab}.`, 'warning');
      return;
    }
    try {
      exportToCSV(filteredItems, `Export_${activeTab}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`);
      addToast(`Exportação de ${activeTab} concluída com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao exportar dados.', 'error');
    }
  };

  const getStatusOptions = () => {
    switch (activeTab) {
      case 'clients':
        return [
          { value: 'all', label: 'Todos os Status' },
          { value: 'Ativo', label: 'Ativos' },
          { value: 'Inativo', label: 'Inativos' }
        ];
      case 'suppliers':
        return [
          { value: 'all', label: 'Todos os Status' },
          { value: 'Ativo', label: 'Ativos' },
          { value: 'Inativo', label: 'Inativos' },
          { value: 'Bloqueado', label: 'Bloqueados' }
        ];
      case 'employees':
        return [
          { value: 'all', label: 'Todos os Status' },
          { value: 'Ativo', label: 'Ativos' },
          { value: 'Férias', label: 'Em Férias' },
          { value: 'Afastado', label: 'Afastados' },
          { value: 'Desligado', label: 'Desligados' }
        ];
      case 'products':
        return [
          { value: 'all', label: 'Todos os Níveis' },
          { value: 'com_estoque', label: 'Com Saldo' },
          { value: 'baixo_estoque', label: 'Estoque Baixo / Alerta' },
          { value: 'sem_estoque', label: 'Sem Estoque (Zero)' }
        ];
      case 'services':
        return [
          { value: 'all', label: 'Todos os Status' },
          { value: 'Ativo', label: 'Disponíveis' },
          { value: 'Inativo', label: 'Indisponíveis' }
        ];
      case 'vehicles':
        return [
          { value: 'all', label: 'Todos os Status' },
          { value: 'Operacional', label: 'Operacionais' },
          { value: 'Manutenção', label: 'Em Manutenção' },
          { value: 'Em Rota', label: 'Em Rota' },
          { value: 'Parado', label: 'Parados' }
        ];
      default:
        return [{ value: 'all', label: 'Todos os Status' }];
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Modal - Enhanced Forms */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-4xl border border-slate-100 dark:border-slate-700 my-8 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest block mb-1">
                  {editingId ? 'Editando Registro' : 'Novo Cadastro'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeTab === 'clients' && 'Cliente'}
                  {activeTab === 'suppliers' && 'Fornecedor'}
                  {activeTab === 'employees' && 'Colaborador'}
                  {activeTab === 'products' && 'Produto / Material'}
                  {activeTab === 'services' && 'Serviço / Prestação'}
                  {activeTab === 'vehicles' && 'Veículo da Frota'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="cadastro-form" onSubmit={handleSave} className="space-y-8">

                {/* --- SEÇÃO 1: INFORMAÇÕES PRINCIPAIS --- */}
                <section>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Dados Principais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Nome / Descrição */}
                    <div className="md:col-span-8">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        {activeTab === 'products' ? 'Descrição do Produto *' : activeTab === 'services' ? 'Descrição do Serviço *' : activeTab === 'vehicles' ? 'Modelo / Nome do Veículo *' : 'Nome Completo / Razão Social *'}
                      </label>
                      <input
                        type="text" required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                        placeholder={activeTab === 'clients' ? 'Ex: Construtora Exemplo Ltda' : activeTab === 'vehicles' ? 'Ex: Volvo FH 540' : activeTab === 'services' ? 'Ex: Locação de Escavadeira 20t' : 'Nome ou Razão Social'}
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 transition-all appearance-none text-sm"
                        value={formData.status || (activeTab === 'vehicles' ? 'Operacional' : 'Ativo')}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        {activeTab === 'clients' && (
                          <>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                          </>
                        )}
                        {activeTab === 'suppliers' && (
                          <>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Bloqueado">Bloqueado</option>
                          </>
                        )}
                        {activeTab === 'employees' && (
                          <>
                            <option value="Ativo">Ativo</option>
                            <option value="Férias">Em Férias</option>
                            <option value="Afastado">Afastado</option>
                            <option value="Desligado">Desligado</option>
                          </>
                        )}
                        {(activeTab === 'products' || activeTab === 'services') && (
                          <>
                            <option value="Ativo">Ativo / Disponível</option>
                            <option value="Inativo">Inativo / Indisponível</option>
                          </>
                        )}
                        {activeTab === 'vehicles' && (
                          <>
                            <option value="Operacional">Operacional</option>
                            <option value="Manutenção">Em Manutenção</option>
                            <option value="Em Rota">Em Rota</option>
                            <option value="Parado">Parado</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Campo Adicional: Nome Fantasia (Fornecedor e Cliente) */}
                    {(activeTab === 'suppliers' || activeTab === 'clients') && (
                      <div className="md:col-span-12">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Nome Fantasia {activeTab === 'clients' ? '(Opcional)' : ''}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                          placeholder={activeTab === 'clients' ? 'Ex: Construtora Exemplo' : 'Ex: Cimentos Votoran'}
                          value={formData.tradeName || ''}
                          onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Campos Específicos por Tipo */}

                    {/* -> CLIENTES & FORNECEDORES & COLABORADORES */}
                    {(activeTab === 'clients' || activeTab === 'suppliers' || activeTab === 'employees') && (
                      <>
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {activeTab === 'employees' ? 'CPF' : 'CPF / CNPJ'}
                            </label>
                            {(activeTab === 'clients' || activeTab === 'suppliers') && (
                              <button
                                type="button"
                                onClick={() => handleCnpjLookup()}
                                disabled={isLoadingCnpj}
                                className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {isLoadingCnpj ? (
                                  <>
                                    <Loader2 size={10} className="animate-spin" /> Buscando...
                                  </>
                                ) : (
                                  <>
                                    <Search size={10} /> Consultar Receita
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              className={`w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500 ${(activeTab === 'clients' || activeTab === 'suppliers') ? 'pr-10' : ''}`}
                              value={formData.document || ''}
                              onChange={e => setFormData({ ...formData, document: formatCPFOrCNPJ(e.target.value) })}
                              onBlur={() => {
                                if (activeTab === 'clients' || activeTab === 'suppliers') {
                                  const docDigits = (formData.document || '').replace(/\D/g, '');
                                  if (docDigits.length === 14) {
                                    handleCnpjLookup(docDigits);
                                  }
                                }
                              }}
                              placeholder={activeTab === 'employees' ? '000.000.000-00' : '00.000.000/0000-00 ou CPF'}
                            />
                            {(activeTab === 'clients' || activeTab === 'suppliers') && (
                              <button
                                type="button"
                                onClick={() => handleCnpjLookup()}
                                disabled={isLoadingCnpj}
                                title="Consultar CNPJ na Receita Federal"
                                className="absolute right-2 p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isLoadingCnpj ? (
                                  <Loader2 size={16} className="animate-spin text-cyan-600" />
                                ) : (
                                  <Search size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">E-mail Principal</label>
                          <input
                            type="email"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                            placeholder="contato@empresa.com.br"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Telefone / WhatsApp</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                            placeholder="(00) 00000-0000"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                          />
                        </div>
                      </>
                    )}

                    {/* -> PRODUTOS & SERVIÇOS */}
                    {(activeTab === 'products' || activeTab === 'services') && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {activeTab === 'services' ? 'Executor / Equipe Técnica' : 'Marca / Fabricante'}
                          </label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            placeholder={activeTab === 'services' ? 'Ex: Equipe de Obras, InfraCore Lab' : 'Ex: Votoran, Gerdau, Tigre'} />
                        </div>
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Categoria (Plano de Contas 1.01)
                            </label>
                            <span className="text-[9px] font-extrabold text-cyan-600 uppercase tracking-wide">
                              Receita Operacional
                            </span>
                          </div>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 outline-none transition-all cursor-pointer"
                            value={formData.category || (activeTab === 'services' ? '1.01.04 - Serviço de Bombeamento de Concreto' : '1.01.01 - Venda de Agregados (Brita/Areia/Pó)')}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                          >
                            {activeTab === 'services' ? (
                              <>
                                <optgroup label="1.01 - Serviços Operacionais (Plano de Contas)">
                                  {PLAN_101_OPTIONS.services.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Outras Categorias">
                                  <option value="Serviços Terceirizados">Serviços Terceirizados</option>
                                  <option value="Mão de Obra Especializada">Mão de Obra Especializada</option>
                                  <option value="Projetos e Engenharia">Projetos e Engenharia</option>
                                  <option value="Manutenção e Reparos">Manutenção e Reparos</option>
                                </optgroup>
                              </>
                            ) : (
                              <>
                                <optgroup label="1.01 - Produtos Industriais e Materiais (Plano de Contas)">
                                  {PLAN_101_OPTIONS.products.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Outras Categorias de Estoque">
                                  <option value="Agregados">Agregados</option>
                                  <option value="Cimentos e Argamassas">Cimentos e Argamassas</option>
                                  <option value="Combustíveis e Óleos">Combustíveis e Óleos</option>
                                  <option value="Aços e Metais">Aços e Metais</option>
                                  <option value="Tubos e Conexões">Tubos e Conexões</option>
                                  <option value="EPIs - Proteção Individual">EPIs - Proteção Individual</option>
                                  <option value="Peças de Reposição">Peças de Reposição</option>
                                </optgroup>
                              </>
                            )}
                            {formData.category &&
                              !PLAN_101_OPTIONS[activeTab === 'services' ? 'services' : 'products'].includes(formData.category) &&
                              !['Agregados', 'Cimentos e Argamassas', 'Combustíveis e Óleos', 'Aços e Metais', 'Tubos e Conexões', 'EPIs - Proteção Individual', 'Peças de Reposição', 'Serviços Terceirizados', 'Mão de Obra Especializada', 'Projetos e Engenharia', 'Manutenção e Reparos'].includes(formData.category) && (
                              <option value={formData.category}>{formData.category} (Personalizada)</option>
                            )}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {activeTab === 'services' ? 'Código de Referência / Contrato' : 'Código de Barras (EAN)'}
                          </label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder={activeTab === 'services' ? 'Ex: SRV-101' : 'Ex: 7891234567890'} />
                        </div>
                      </>
                    )}

                    {/* -> VEÍCULOS */}
                    {activeTab === 'vehicles' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Veículo</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.type || 'Carro'}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                          >
                            <option value="Carro">Carro de Passeio</option>
                            <option value="Utilitário">Utilitário (Picape/Furgão)</option>
                            <option value="Caminhão">Caminhão</option>
                            <option value="Toco">Caminhão Toco</option>
                            <option value="Truck">Caminhão Truck</option>
                            <option value="Carreta LS">Carreta LS</option>
                            <option value="Máquina">Máquina Pesada</option>
                            <option value="Motocicleta">Motocicleta</option>
                            <option value="Van">Van</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca / Fabricante</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            placeholder="Ex: Volvo, Scania, Fiat"
                            value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ano Fabricação</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            placeholder="Ex: 2023"
                            value={formData.year || ''} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) || '' })} />
                        </div>

                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Placa *
                            </label>
                            <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Base Nacional
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-xl p-3 pr-36 text-lg font-black text-center uppercase tracking-widest text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              value={formData.plate || ''}
                              onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8) })}
                              placeholder="ABC-1234"
                              maxLength={8}
                            />
                            <div className="absolute right-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setTempApiConfig(apiConfig);
                                  setTempApiToken(apiBrasilToken);
                                  setIsApiTokenModalOpen(true);
                                }}
                                className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${apiBrasilToken ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'}`}
                                title={apiBrasilToken ? "Token da APIBrasil Configurado (clique para alterar)" : "Configurar Token da APIBrasil"}
                              >
                                <Settings size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePlateLookup()}
                                disabled={isLoadingPlate}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                title="Consultar dados do veículo na Base Nacional"
                              >
                                {isLoadingPlate ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                                <span>{isLoadingPlate ? 'Buscando...' : 'Consultar'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Renavam</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.renavam || ''} onChange={e => setFormData({ ...formData, renavam: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cor</label>
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-1 pr-3">
                            <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" value={formData.color || '#ffffff'} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                            <input type="text" className="bg-transparent border-none text-sm font-medium w-full focus:ring-0" placeholder="Ex: Branco" value={formData.colorName || ''} onChange={e => setFormData({ ...formData, colorName: e.target.value })} />
                          </div>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Chassi (Opcional)</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.chassis || ''} onChange={e => setFormData({ ...formData, chassis: e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* --- SEÇÃO 2: DETALHES OPERACIONAIS --- */}
                <section>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Detalhes Operacionais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* ADICIONAIS: Clientes & Fornecedores */}
                    {(activeTab === 'clients' || activeTab === 'suppliers') && (
                      <>
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Contato Comercial (Pessoa)</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Ex: João da Silva" />
                        </div>
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Inscrição Estadual</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.stateReg || ''} onChange={e => setFormData({ ...formData, stateReg: e.target.value })} placeholder="Isento ou Nº" />
                        </div>
                        {activeTab === 'clients' && (
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Limite de Crédito (R$)</label>
                            <input type="number" min="0" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-emerald-600"
                              value={formData.creditLimit ?? ''} onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                          </div>
                        )}
                        {activeTab === 'clients' && (
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Cadastro</label>
                            <select
                              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                              value={formData.type || 'Matriz'}
                              onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                              <option value="Matriz">Matriz</option>
                              <option value="Filial">Filial</option>
                              <option value="Parceiro">Parceiro</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* ADICIONAIS: Colaboradores */}
                    {activeTab === 'employees' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cargo / Função</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.role || ''}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {[
                              'Ajudante Geral',
                              'Analista Financeiro',
                              'Apontador',
                              'Assistente Administrativo',
                              'Comprador',
                              'Diretor',
                              'Eletricista',
                              'Engenheiro Civil',
                              'Gerente de Obras',
                              'Gerente de Projetos',
                              'Mecânico',
                              'Mestre de Obras',
                              'Motorista',
                              'Operador de Máquinas',
                              'Pedreiro',
                              'Servente',
                              'Técnico de Segurança',
                              'Vendedor'
                            ].map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Departamento</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                            <option value="">Selecione...</option>
                            <option value="Administrativo">Administrativo</option>
                            <option value="Engenharia">Engenharia</option>
                            <option value="Financeiro">Financeiro</option>
                            <option value="Operacional">Operacional</option>
                            <option value="Vendas">Vendas</option>
                            <option value="RH">RH</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Data Admissão</label>
                          <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={toInputDate(formData.admissionDate)}
                            onChange={e => setFormData({ ...formData, admissionDate: e.target.value ? e.target.value.split('-').reverse().join('/') : '' })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Salário Base (R$)</label>
                          <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.salary ?? ''} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </>
                    )}

                    {/* ADICIONAIS: Produtos & Serviços */}
                    {(activeTab === 'products' || activeTab === 'services') && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {activeTab === 'services' ? 'Preço do Serviço (R$)' : 'Preço de Venda (R$)'}
                          </label>
                          <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-emerald-600"
                            value={formData.price ?? ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {activeTab === 'services' ? 'Custo Operacional Estimado (R$)' : 'Preço de Custo (R$)'}
                          </label>
                          <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium text-slate-500"
                            value={formData.costPrice ?? ''} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                        </div>
                        {activeTab === 'products' ? (
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Estoque Atual</label>
                            <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold"
                              value={formData.quantity ?? ''} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                          </div>
                        ) : (
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Disponibilidade</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                              value={formData.availability || 'Imediata'} onChange={e => setFormData({ ...formData, availability: e.target.value })} placeholder="Ex: Imediata / Sob Agendamento" />
                          </div>
                        )}
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unidade de Medida / Cobrança</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.unit || (activeTab === 'services' ? 'h' : 'ton')} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                            {activeTab === 'services' ? (
                              <>
                                <option value="h">Hora (h)</option>
                                <option value="m2">Metro² (m²)</option>
                                <option value="m3">Metro³ (m³)</option>
                                <option value="un">Unidade / Laudo (un)</option>
                                <option value="dia">Diária (dia)</option>
                                <option value="mes">Mensal (mês)</option>
                                <option value="serv">Serviço Global (serv)</option>
                                <option value="ton">Por Tonelada (ton)</option>
                              </>
                            ) : (
                              <>
                                <option value="ton">Tonelada (ton)</option>
                                <option value="m3">Metro³ (m³)</option>
                                <option value="un">Unidade (un)</option>
                                <option value="kg">Quilo (kg)</option>
                                <option value="m">Metro (m)</option>
                                <option value="m2">Metro² (m²)</option>
                                <option value="sc">Saco (sc)</option>
                                <option value="l">Litro (l)</option>
                              </>
                            )}
                          </select>
                        </div>
                        {activeTab === 'products' && (
                          <>
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Estoque Mínimo (Alerta)</label>
                              <input type="number" step="0.01" min="0" className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl p-3 text-sm font-bold text-rose-600"
                                value={formData.minStock ?? ''} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Peso Unitário (kg)</label>
                              <input type="number" step="0.001" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                                value={formData.weight ?? ''} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })} />
                            </div>
                          </>
                        )}
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {activeTab === 'services' ? 'Local / Base de Execução' : 'Localização (Rua/Box/Pátio)'}
                          </label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder={activeTab === 'services' ? 'Ex: Frentes de Obras, Canteiro' : 'Ex: Box A-02, Silo 01'} />
                        </div>
                      </>
                    )}

                    {/* ADICIONAIS: Veículos (Detalhes Operacionais) */}
                    {activeTab === 'vehicles' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Quilometragem Atual (Km)</label>
                          <input type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.km ?? ''} onChange={e => setFormData({ ...formData, km: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Próx. Manutenção (Km)</label>
                          <input type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium text-amber-600"
                            value={formData.nextMaintenanceKm ?? ''} onChange={e => setFormData({ ...formData, nextMaintenanceKm: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Combustível</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.fuelType || 'Diesel'} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}>
                            <option value="Diesel">Diesel</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Etanol">Etanol</option>
                            <option value="Flex">Flex</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Elétrico">Elétrico</option>
                          </select>
                        </div>

                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Motorista Responsável</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.driverId || ''}
                            onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {(employees || []).map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Vencimento do Seguro</label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={toInputDate(formData.insuranceExpiry)}
                            onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value ? e.target.value.split('-').reverse().join('/') : '' })}
                          />
                        </div>
                      </>
                    )}

                    {/* ENDEREÇO (Comum a Clientes, Fornecedores e Colaboradores) */}
                    {(activeTab === 'clients' || activeTab === 'suppliers' || activeTab === 'employees') && (
                      <div className="md:col-span-12 mt-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Endereço Completo
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">CEP</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              placeholder="00000-000"
                              value={formData.address?.zipCode || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), zipCode: formatCEP(e.target.value) } })}
                            />
                          </div>
                          <div className="col-span-4 md:col-span-4">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Logradouro (Rua/Av)</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              placeholder="Rua Exemplo"
                              value={formData.address?.street || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), street: e.target.value } })}
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Número</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              placeholder="123"
                              value={formData.address?.number || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), number: e.target.value } })}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Bairro</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              placeholder="Bairro"
                              value={formData.address?.district || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), district: e.target.value } })}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              placeholder="Cidade"
                              value={formData.address?.city || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), city: e.target.value } })}
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">UF</label>
                            <input
                              type="text"
                              maxLength={2}
                              className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700 uppercase"
                              placeholder="SP"
                              value={formData.address?.state || ''}
                              onChange={e => setFormData({ ...formData, address: { ...(formData.address || {}), state: e.target.value.toUpperCase() } })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* --- SEÇÃO 3: ANEXOS (Comum) --- */}
                <section>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span> Documentação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-all group relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const at = { id: Date.now().toString(), name: file.name, date: new Date().toLocaleDateString('pt-BR'), size: (file.size / 1024).toFixed(1) + 'KB' };
                          setFormData({ ...formData, attachments: [...(formData.attachments || []), at] });
                          addToast(`Arquivo "${file.name}" anexado com sucesso.`, 'info');
                        }
                      }} />
                      <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload size={24} className="text-cyan-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Clique para Anexar</span>
                      <span className="text-[10px] text-slate-400 uppercase mt-1">PDF, Imagens ou Documentos</span>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {formData.attachments?.map((at: any) => (
                        <div key={at.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-500">
                              <File size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{at.name}</span>
                              <span className="text-[9px] text-slate-400">{at.date} • {at.size}</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => setFormData({ ...formData, attachments: formData.attachments.filter((a: any) => a.id !== at.id) })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                      {(!formData.attachments || formData.attachments.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                          <Paperclip size={24} className="mb-2 opacity-50" />
                          <p className="text-[10px] uppercase font-bold text-center">Nenhum documento anexado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 z-10">
              <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => (document.getElementById('cadastro-form') as HTMLFormElement)?.requestSubmit()} className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                <Save size={16} /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

{/* Modal de Configuração de APIs Veiculares (Multi-Provedores Gratuitos e Comerciais) */}
      {isApiTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">APIs de Consulta Veicular</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Nacional & Tabela FIPE</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiTokenModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Configure os provedores de consulta por placa. O sistema conta com <strong>APIs gratuitas</strong> e permite adicionar suas próprias chaves para dados aprofundados.
              </p>

              {/* 1. Menu Suspenso: Provedor Preferencial */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Provedor Preferencial de Busca
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  value={tempApiConfig.provider || 'auto'}
                  onChange={e => setTempApiConfig({ ...tempApiConfig, provider: e.target.value })}
                >
                  <option value="auto">⚡ Modo Cascata Inteligente (Grátis Primeiro → Chaves)</option>
                  <option value="fipe_api">🟢 Fipe.api.br (500 consultas/dia 100% Grátis)</option>
                  <option value="fipex">🟢 FipeX / Tabela Fipe Livre (100% Grátis & Aberta)</option>
                  <option value="senatran_geo">🟢 SENATRAN Faixas Geográficas (100% Grátis & Offline)</option>
                  <option value="apibrasil">🔑 APIBrasil (apibrasil.io - SENATRAN Completo)</option>
                  <option value="wdapi">🔑 WDAPI (wdapi2.com.br - Placas & Chassi)</option>
                </select>
              </div>

              {/* Box Informativo: Provedores Gratuitos Ativos */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs space-y-1">
                <p className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle size={14} /> APIs Gratuitas Pré-Configuradas:
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  • <strong>Fipe.api.br</strong>: Cota livre de até 500 consultas diárias.<br />
                  • <strong>SENATRAN Faixas Oficiais</strong>: Validação e identificação do estado de origem 100% livre e sem custo.<br />
                  • <strong>Tabela Fipe Aberta</strong>: Mapeamento de marcas e modelos em modo aberto.
                </p>
              </div>

              {/* 2. Campo Token APIBrasil */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Token APIBrasil (apibrasil.io)
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold lowercase">opcional com cota grátis</span>
                </div>
                <input
                  type="password"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Bearer Token da APIBrasil (opcional)..."
                  value={tempApiConfig.apiBrasilToken || ''}
                  onChange={e => setTempApiConfig({ ...tempApiConfig, apiBrasilToken: e.target.value })}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Plano com créditos gratuitos de teste:</span>
                  <a href="https://apibrasil.io" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">
                    apibrasil.io <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* 3. Campo Token WDAPI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Token WDAPI (wdapi2.com.br)
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold lowercase">opcional</span>
                </div>
                <input
                  type="password"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Token WDAPI para dados de chassi..."
                  value={tempApiConfig.wdapiToken || ''}
                  onChange={e => setTempApiConfig({ ...tempApiConfig, wdapiToken: e.target.value })}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Chave de homologação / desenvolvedor:</span>
                  <a href="https://wdapi2.com.br" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">
                    wdapi2.com.br <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* 4. Campo Token Fipe.api.br (Opcional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Token Fipe.api.br
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold lowercase">expande limite grátis</span>
                </div>
                <input
                  type="password"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Token de cadastro grátis (expande para 1000/dia)..."
                  value={tempApiConfig.fipeApiToken || ''}
                  onChange={e => setTempApiConfig({ ...tempApiConfig, fipeApiToken: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsApiTokenModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveApiConfig}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Save size={14} /> Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-1">Cadastros Centrais</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Gestão Operacional</h2>
        </div>
        <div className="flex items-center gap-3">
          {canManage(activeTab) && (
            <button onClick={() => handleOpenModal()} className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
              <Plus size={20} /> Adicionar Novo
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex gap-8 overflow-x-auto pb-0">
          <TabButton id="clients" icon={User} label="Clientes" count={(clients || []).length} />
          <TabButton id="suppliers" icon={Warehouse} label="Fornecedores" count={(suppliers || []).length} />
          <TabButton id="employees" icon={Badge} label="Colaboradores" count={(employees || []).length} />
          <TabButton id="products" icon={Package} label="Produtos" count={(inventory || []).filter(p => !isServiceItem(p)).length} />
          <TabButton id="services" icon={Wrench} label="Serviços" count={(inventory || []).filter(p => isServiceItem(p)).length} />
          <TabButton id="vehicles" icon={Truck} label="Veículos" count={(fleet || []).length} />
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full max-w-2xl">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 transition-all text-sm font-medium"
              placeholder={`Pesquisar por nome, documento, contato em ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              {getStatusOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              title="Limpar filtros"
              className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl text-slate-500 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-bold text-slate-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'registro' : 'registros'}
          </span>
          <button
            onClick={handleExport}
            title="Exportar dados filtrados para CSV"
            className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-2xl shadow-sm transition-all border border-transparent hover:border-emerald-100 flex items-center gap-2"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Tabela de Registros */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação / Detalhes</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Informações</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={36} className="text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-sm text-slate-500">Nenhum registro encontrado</p>
                    <p className="text-xs text-slate-400">Tente ajustar seus termos de pesquisa ou o filtro de status.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-black text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors shrink-0">
                        {item.initials || (item.name || item.model || '?').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name || item.model}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tabular-nums">
                          {item.document || item.plate || (item.barcode ? `EAN: ${item.barcode}` : 'REF-' + (item.id || '').slice(-4))}
                        </p>
                        {activeTab === 'clients' && (item.tradeName || item.email || item.phone) && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.tradeName ? <span className="text-cyan-600 font-bold mr-1">[{item.tradeName}]</span> : null}
                            {item.email || ''}{item.email && item.phone ? ' • ' : ''}{item.phone || ''}
                          </p>
                        )}
                        {activeTab === 'suppliers' && (item.tradeName || item.email || item.phone) && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.tradeName ? <span className="text-cyan-600 font-bold mr-1">[{item.tradeName}]</span> : null}
                            {item.email || ''}{item.email && item.phone ? ' • ' : ''}{item.phone || ''}
                          </p>
                        )}
                        {activeTab === 'employees' && item.role && (
                          <p className="text-[10px] text-slate-400 font-medium">{item.role} {item.department ? `• Depto: ${item.department}` : ''}</p>
                        )}
                        {activeTab === 'products' && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-cyan-600 font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} • Estoque: {item.quantity || 0} {item.unit || 'un'}
                              
                            </p>
                            {(item.location || item.brand) && (
                              <p className="text-[9px] text-slate-400 font-medium">
                                {item.location ? `Loc: ${item.location}` : ''}
                                {item.location && item.brand ? ' • ' : ''}
                                {item.brand ? `Marca: ${item.brand}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                        {activeTab === 'services' && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-cyan-600 font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} / {item.unit || 'h'}
                              
                            </p>
                            {(item.location || item.brand) && (
                              <p className="text-[9px] text-slate-400 font-medium">
                                {item.location ? `Base/Frente: ${item.location}` : ''}
                                {item.location && item.brand ? ' • ' : ''}
                                {item.brand ? `Equipe: ${item.brand}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                        {activeTab === 'vehicles' && (
                          <p className="text-[10px] text-slate-400 font-medium">{item.type || 'Veículo'} • {item.brand || ''} {item.year ? `(${item.year})` : ''}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Ativo' || item.status === 'Operacional' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Bloqueado' || item.status === 'Desligado' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.status || 'Ativo'}
                    </span>
                    {item.attachments?.length > 0 && (
                      <span className="ml-2 text-[9px] font-bold text-cyan-600 uppercase inline-flex items-center gap-1">
                        <Paperclip size={10} /> {item.attachments.length} Anexos
                      </span>
                    )}
                    {activeTab === 'clients' && item.creditLimit !== undefined && item.creditLimit > 0 && (
                      <span className="ml-2 text-[9px] font-bold text-emerald-600 uppercase">
                        Crédito: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.creditLimit)}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(activeTab === 'products' || activeTab === 'services') && canManage(activeTab) && (
                        <button onClick={() => handleDuplicate(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Duplicar"><Copy size={18} /></button>
                      )}
                      {canManage(activeTab) && (
                        <>
                          <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all" title="Editar"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Excluir"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
