import {
    Client, Supplier, Employee, InventoryItem, FleetVehicle,
    Transaction, Sale, Budget, PurchaseOrder, MaintenanceRecord,
    FuelLog, AuditLog, AppSettings, ProductionOrder,
    ProductionFormula, ProductionUnit, StockMovement, FinancialAccount,
    PlanOfAccountNode, Tire, PayrollRecord, TimeLog, Vacation, SalaryAdvance
} from '../../types';
import { INITIAL_PLAN_OF_ACCOUNTS } from '../../context/constants/initialState';

// Helper utilities for date and generation
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

/**
 * Gera a base completa e moderna da Planta Industrial do InfraCore ERP:
 * - Unidades de Britagem, Usina de Asfalto (CBUQ) e Central de Concreto Usinado
 * - Laboratório Tecnológico Normativo DNIT e Fórmulas Parametrizadas
 * - Frota Pesada com Gestão de Pneus e Telemetria
 * - Contas Financeiras e DRE com Plano de Contas Estruturado
 * - Colaboradores Industriais, Folha CLT e Rastreabilidade Operacional
 */
export const generateIndustrialPlantData = () => {
    const today = new Date();
    const startDate = new Date(new Date().setFullYear(today.getFullYear() - 2)); // 2 anos de histórico refinado

    // 1. CONFIGURAÇÕES CORPORATIVAS DA PLANTA
    const settings: AppSettings = {
        companyName: 'InfraCore Indústria de Asfalto & Concreto Ltda',
        tradeName: 'InfraCore Planta Industrial',
        document: '32.845.912/0001-70',
        email: 'industrial@infracore.com.br',
        phone: '(11) 4002-8922',
        address: 'Rodovia Industrial SP-330, Km 42 - Distrito Tecnológico, SP',
        currency: 'BRL',
        language: 'pt-BR',
        theme: 'dark',
        bankDetails: {
            bankName: 'Banco do Brasil',
            agency: '3420-1',
            account: '88.420-5',
            pixKey: '32.845.912/0001-70',
            pixType: 'CNPJ'
        },
        notifications: {
            stockAlerts: true,
            overdueFinance: true,
            productionUpdates: true,
            fleetMaintenance: true
        },
        technical: {
            taxRegime: 'Lucro Real',
            defaultTaxRate: 14.5,
            financialYearStart: '01/01',
            dateFormat: 'DD/MM/YYYY',
            timezone: 'America/Sao_Paulo'
        },
        backup: {
            autoBackup: true,
            frequency: 'daily',
            lastBackup: new Date().toISOString()
        },
        operational: {
            minMargin: 18,
            defaultPaymentTerm: 28,
            safetyStock: 40
        },
        integrations: {
            nfe: { name: 'Nota Fiscal Eletrônica (NF-e)', status: 'Ativo', category: 'Fiscal' },
            nfse: { name: 'Nota Fiscal de Serviço (NFS-e)', status: 'Ativo', category: 'Fiscal' },
            pix: { name: 'PIX Copia e Cola / QRCode BCB', status: 'Ativo', category: 'Financeiro' },
            sinapi: { name: 'SINAPI / DNIT Índices', status: 'Ativo', category: 'Engenharia' }
        },
        emailConfig: {
            smtpServer: 'smtp.infracore.com.br',
            smtpPort: 587,
            senderEmail: 'industrial@infracore.com.br'
        },
        documents: {
            printerMain: 'HP LaserJet Enterprise',
            printerThermal: 'Zebra ZD421',
            margins: 10,
            copies: 1,
            showLogo: true,
            watermarkDraft: true,
            qrCode: true,
            autoNumbering: true,
            digitalSignature: true,
            customFooter: true,
            barcode: true,
            authSeal: true
        },
        performance: {
            cacheSize: 500,
            imageQuality: 85,
            autoCompression: true,
            lazyLoading: true,
            preloading: true,
            gzip: true,
            autoIndexing: true,
            queryCache: true,
            minifyAssets: true,
            cdn: false,
            dbPooling: true
        }
    };

    // 2. UNIDADES INDUSTRIAIS OPERACIONAIS (Usinas e Britadores)
    const productionUnits: ProductionUnit[] = [
        {
            id: 'unit-brit-1',
            name: 'Britador Primário de Mandíbula Metso C130',
            type: 'Britagem',
            status: 'Operando',
            capacity: '450 ton/h',
            currentLoad: 85,
            temp: 68,
            power: '280 kW',
            location: 'Pedreira Central - Frente Gnaisse'
        },
        {
            id: 'unit-brit-2',
            name: 'Britador Secundário Cônico Sandvik CH440',
            type: 'Britagem',
            status: 'Operando',
            capacity: '380 ton/h',
            currentLoad: 80,
            temp: 74,
            power: '220 kW',
            location: 'Pátio de Agregados & Peneiramento'
        },
        {
            id: 'unit-asf-1',
            name: 'Usina de Asfalto CIBER iNOVA 2000 (Contínua)',
            type: 'Usina Asfalto',
            status: 'Operando',
            capacity: '160 ton/h',
            currentLoad: 75,
            temp: 168,
            power: '250 kW',
            location: 'Pátio Industrial - Setor Pavimentação'
        },
        {
            id: 'unit-conc-1',
            name: 'Central Dosadora de Concreto Liebherr Betomix 2.5',
            type: 'Usina Concreto',
            status: 'Operando',
            capacity: '80 m³/h',
            currentLoad: 65,
            temp: 26,
            power: '140 kW',
            location: 'Pátio Industrial - Central Dosadora'
        },
        {
            id: 'unit-solos-1',
            name: 'Central de Mistura de Solos & Brita Graduada (BGS)',
            type: 'Britagem',
            status: 'Operando',
            capacity: '250 ton/h',
            currentLoad: 50,
            temp: 32,
            power: '90 kW',
            location: 'Pátio de Estabilização e Bases'
        }
    ];

    // 3. CONTAS BANCÁRIAS E FINANCEIRAS OPERACIONAIS
    const accounts: FinancialAccount[] = [
        {
            id: 'acc-bb',
            name: 'Banco do Brasil - Movimento Principal',
            type: 'Corrente',
            balance: 642850.40,
            initialBalance: 250000.00,
            bank: 'Banco do Brasil',
            bankCode: '001',
            bankName: 'Banco do Brasil S.A.',
            agency: '3420',
            agencyDigit: '1',
            accountNumber: '88420',
            accountDigit: '5',
            color: 'bg-amber-600',
            pixType: 'CNPJ',
            pixKey: '32.845.912/0001-70',
            isDefault: true,
            status: 'Ativo'
        },
        {
            id: 'acc-bradesco',
            name: 'Bradesco - Cobrança & Folha de Pagamento',
            type: 'Corrente',
            balance: 318400.00,
            initialBalance: 120000.00,
            bank: 'Banco Bradesco',
            bankCode: '237',
            bankName: 'Banco Bradesco S.A.',
            agency: '1120',
            agencyDigit: '0',
            accountNumber: '44520',
            accountDigit: '9',
            color: 'bg-rose-600',
            pixType: 'E-mail',
            pixKey: 'financeiro@infracore.com.br',
            status: 'Ativo'
        },
        {
            id: 'acc-caixa-tesouraria',
            name: 'Caixa Geral (Tesouraria & Frente de Usina)',
            type: 'Espécie',
            balance: 28650.00,
            initialBalance: 15000.00,
            color: 'bg-emerald-600',
            code: 'Cofre Industrial / Pátio',
            isDefault: false,
            status: 'Ativo'
        },
        {
            id: 'acc-invest',
            name: 'Santander - Aplicação Liquidez Imediata',
            type: 'Investimento',
            balance: 850000.00,
            initialBalance: 500000.00,
            bank: 'Banco Santander',
            bankCode: '033',
            bankName: 'Banco Santander Brasil',
            agency: '0410',
            accountNumber: '13009210',
            color: 'bg-indigo-600',
            status: 'Ativo'
        }
    ];

    // 4. PLANO DE CONTAS GERENCIAL COMPLETO (VINCULADO AO DRE)
    const planOfAccounts: PlanOfAccountNode[] = INITIAL_PLAN_OF_ACCOUNTS;

    // 5. INVENTÁRIO, INSUMOS E PRODUTOS ACABADOS
    const inventory: InventoryItem[] = [
        // Matérias-Primas
        { id: 'inv-mat-1', name: 'Rocha Bruta Detonada (Gnaisse de Alta Dureza)', category: 'Matéria Prima', quantity: 28000, unit: 'ton', price: 0, costPrice: 14.20, minStock: 6000, location: 'Pilha Pulmão da Mina' },

        // Agregados Produzidos
        { id: 'inv-agr-1', name: 'Rachão / Pedra de Mão (100 a 250 mm)', category: 'Agregado', quantity: 8500, unit: 'ton', price: 44.00, costPrice: 16.50, minStock: 1500, location: 'Baia 01 - Rachão' },
        { id: 'inv-agr-2', name: 'Brita 2 (19 a 25 mm)', category: 'Agregado', quantity: 6400, unit: 'ton', price: 62.00, costPrice: 24.00, minStock: 1000, location: 'Baia 02 - Brita 2' },
        { id: 'inv-agr-3', name: 'Brita 1 (9,5 a 19 mm)', category: 'Agregado', quantity: 12500, unit: 'ton', price: 65.00, costPrice: 24.50, minStock: 2000, location: 'Baia 03 - Brita 1' },
        { id: 'inv-agr-4', name: 'Brita 0 / Pedrisco Limpo (4,75 a 9,5 mm)', category: 'Agregado', quantity: 9200, unit: 'ton', price: 68.00, costPrice: 26.00, minStock: 1200, location: 'Baia 04 - Pedrisco' },
        { id: 'inv-agr-5', name: 'Pó de Pedra Industrial (Fração Areia Fina)', category: 'Agregado', quantity: 14000, unit: 'ton', price: 48.00, costPrice: 19.00, minStock: 2500, location: 'Baia 05 - Pó de Pedra' },
        { id: 'inv-agr-6', name: 'Areia Industrial Usinada (Lavada e Classificada)', category: 'Agregado', quantity: 7800, unit: 'ton', price: 72.00, costPrice: 28.00, minStock: 1500, location: 'Baia 06 - Areia Industrial' },
        { id: 'inv-agr-7', name: 'Brita Graduada Simples (BGS Normatizada)', category: 'Agregado', quantity: 11000, unit: 'ton', price: 54.00, costPrice: 21.00, minStock: 2000, location: 'Pátio BGS' },

        // Insumos Industriais Adquiridos
        { id: 'inv-ins-1', name: 'Cimento CP-V ARI a Granel (Alta Resistência Inicial)', category: 'Insumo', quantity: 240, unit: 'ton', price: 0, costPrice: 510.00, minStock: 60, location: 'Silo 1 & Silo 2 (Central Concreto)', supplierId: 'sup-1' },
        { id: 'inv-ins-2', name: 'Cimento Asfáltico de Petróleo CAP 50/70', category: 'Insumo', quantity: 110, unit: 'ton', price: 0, costPrice: 4250.00, minStock: 30, location: 'Tanque Aquecido Térmico #1 (Usina Asfalto)', supplierId: 'sup-2' },
        { id: 'inv-ins-3', name: 'Emulsão Asfáltica Catiônica RR-2C (Imprimação/Pintura)', category: 'Insumo', quantity: 35, unit: 'ton', price: 0, costPrice: 3400.00, minStock: 10, location: 'Tanque Estático #2', supplierId: 'sup-2' },
        { id: 'inv-ins-4', name: 'Aditivo Superplastificante Redutor de Água (MasterGlenium)', category: 'Insumo', quantity: 4500, unit: 'L', price: 0, costPrice: 16.80, minStock: 800, location: 'Almoxarifado Químico', supplierId: 'sup-3' },
        { id: 'inv-ins-5', name: 'Cal Hidratada Especial para Asfalto (Filler Ativo)', category: 'Insumo', quantity: 40, unit: 'ton', price: 0, costPrice: 390.00, minStock: 12, location: 'Silo de Fíler Usina', supplierId: 'sup-1' },
        { id: 'inv-ins-6', name: 'Óleo Combustível Industrial BPF (Queimador Secador)', category: 'Insumo', quantity: 28000, unit: 'L', price: 0, costPrice: 4.20, minStock: 8000, location: 'Tanque de Combustível da Usina', supplierId: 'sup-5' },
        { id: 'inv-ins-7', name: 'Óleo Diesel S10 Rodoviário (Abastecimento Frota)', category: 'Insumo', quantity: 35000, unit: 'L', price: 0, costPrice: 5.75, minStock: 10000, location: 'Posto de Abastecimento Interno', supplierId: 'sup-5' },

        // Produtos Usinados e Misturas (Catálogo de Venda com Traço e Normatização)
        { id: 'inv-prod-cbuq-c', name: 'Massa Asfáltica CBUQ Faixa C (Capa de Rolamento DNIT 031-ES)', category: 'Asfalto', quantity: 450, unit: 'ton', price: 580.00, costPrice: 435.00, minStock: 0, location: 'Silo Quente de Descarga Direta' },
        { id: 'inv-prod-cbuq-b', name: 'Massa Asfáltica CBUQ Faixa B (Binder / Ligação)', category: 'Asfalto', quantity: 300, unit: 'ton', price: 540.00, costPrice: 398.00, minStock: 0, location: 'Silo Quente de Descarga Direta' },
        { id: 'inv-prod-fck25', name: 'Concreto Usinado FCK 25 MPa (Slump 10±2 cm)', category: 'Concreto', quantity: 180, unit: 'm³', price: 440.00, costPrice: 320.00, minStock: 0, location: 'Carregamento Direto em Betoneira' },
        { id: 'inv-prod-fck30', name: 'Concreto Usinado FCK 30 MPa Bombeável (Slump 14±2 cm)', category: 'Concreto', quantity: 240, unit: 'm³', price: 475.00, costPrice: 348.00, minStock: 0, location: 'Carregamento Direto em Betoneira' },
        { id: 'inv-prod-fck40', name: 'Concreto Usinado FCK 40 MPa Estrutural de Alto Desempenho', category: 'Concreto', quantity: 90, unit: 'm³', price: 540.00, costPrice: 395.00, minStock: 0, location: 'Carregamento Direto em Betoneira' }
    ];

    // 6. FÓRMULAS E TRAÇOS INDUSTRIAIS NORMATIZADOS
    const formulas: ProductionFormula[] = [
        {
            id: 'form-cbuq-c',
            name: 'Massa Asfáltica CBUQ Faixa C (DNIT 031-ES)',
            category: 'Asfalto',
            outputProductId: 'inv-prod-cbuq-c',
            ingredients: [
                { productId: 'inv-ins-2', name: 'Cimento Asfáltico CAP 50/70', qty: 54, unit: 'kg' },
                { productId: 'inv-agr-5', name: 'Pó de Pedra Industrial', qty: 420, unit: 'kg' },
                { productId: 'inv-agr-4', name: 'Pedrisco / Brita 0', qty: 310, unit: 'kg' },
                { productId: 'inv-agr-3', name: 'Brita 1 (Gnaisse)', qty: 200, unit: 'kg' },
                { productId: 'inv-ins-5', name: 'Cal Hidratada (Filler Ativo)', qty: 16, unit: 'kg' }
            ]
        },
        {
            id: 'form-cbuq-b',
            name: 'Massa Asfáltica CBUQ Faixa B (Binder / Regularização)',
            category: 'Asfalto',
            outputProductId: 'inv-prod-cbuq-b',
            ingredients: [
                { productId: 'inv-ins-2', name: 'Cimento Asfáltico CAP 50/70', qty: 48, unit: 'kg' },
                { productId: 'inv-agr-5', name: 'Pó de Pedra Industrial', qty: 350, unit: 'kg' },
                { productId: 'inv-agr-3', name: 'Brita 1 (Gnaisse)', qty: 320, unit: 'kg' },
                { productId: 'inv-agr-2', name: 'Brita 2 (Gnaisse)', qty: 270, unit: 'kg' },
                { productId: 'inv-ins-5', name: 'Cal Hidratada (Filler)', qty: 12, unit: 'kg' }
            ]
        },
        {
            id: 'form-fck25',
            name: 'Traço Concreto FCK 25 MPa Padrão Estrutural',
            category: 'Concreto',
            outputProductId: 'inv-prod-fck25',
            ingredients: [
                { productId: 'inv-ins-1', name: 'Cimento CP-V ARI', qty: 320, unit: 'kg' },
                { productId: 'inv-agr-6', name: 'Areia Industrial Lavada', qty: 780, unit: 'kg' },
                { productId: 'inv-agr-3', name: 'Brita 1', qty: 940, unit: 'kg' },
                { productId: 'inv-ins-4', name: 'Aditivo Superplastificante', qty: 2.8, unit: 'L' }
            ]
        },
        {
            id: 'form-fck30',
            name: 'Traço Concreto FCK 30 MPa Bombeável',
            category: 'Concreto',
            outputProductId: 'inv-prod-fck30',
            ingredients: [
                { productId: 'inv-ins-1', name: 'Cimento CP-V ARI', qty: 360, unit: 'kg' },
                { productId: 'inv-agr-6', name: 'Areia Industrial Lavada', qty: 740, unit: 'kg' },
                { productId: 'inv-agr-3', name: 'Brita 1', qty: 920, unit: 'kg' },
                { productId: 'inv-agr-4', name: 'Pedrisco (Brita 0)', qty: 150, unit: 'kg' },
                { productId: 'inv-ins-4', name: 'Aditivo Superplastificante', qty: 3.6, unit: 'L' }
            ]
        },
        {
            id: 'form-fck40',
            name: 'Traço Concreto FCK 40 MPa Alta Resistência',
            category: 'Concreto',
            outputProductId: 'inv-prod-fck40',
            ingredients: [
                { productId: 'inv-ins-1', name: 'Cimento CP-V ARI', qty: 420, unit: 'kg' },
                { productId: 'inv-agr-6', name: 'Areia Industrial Lavada', qty: 690, unit: 'kg' },
                { productId: 'inv-agr-3', name: 'Brita 1', qty: 980, unit: 'kg' },
                { productId: 'inv-ins-4', name: 'Aditivo Superplastificante', qty: 4.8, unit: 'L' }
            ]
        }
    ];

    // 7. FROTA PESADA, MÁQUINAS E CAMINHÕES TRAÇADOS
    const fleet: FleetVehicle[] = [
        { id: 'eq-cat-336', name: 'Escavadeira Hidráulica CAT 336D (40 ton)', plate: 'CAT-336-01', type: 'Máquina', status: 'Operacional', km: 11450, fuelType: 'Diesel', brand: 'Caterpillar', model: '336D L', year: 2022 },
        { id: 'eq-pc-350', name: 'Escavadeira Komatsu PC350LC', plate: 'KOM-350-02', type: 'Máquina', status: 'Operacional', km: 9800, fuelType: 'Diesel', brand: 'Komatsu', model: 'PC350LC-8', year: 2023 },
        { id: 'eq-volvo-120a', name: 'Pá Carregadeira Volvo L120H #01 (Pátio Britagem)', plate: 'VOL-120-01', type: 'Máquina', status: 'Operacional', km: 16400, fuelType: 'Diesel', brand: 'Volvo', model: 'L120H', year: 2021 },
        { id: 'eq-volvo-120b', name: 'Pá Carregadeira Volvo L120H #02 (Alimentação Usinas)', plate: 'VOL-120-02', type: 'Máquina', status: 'Operacional', km: 14200, fuelType: 'Diesel', brand: 'Volvo', model: 'L120H', year: 2022 },
        { id: 'eq-perf-fox', name: 'Carreta Perfuratriz Hidráulica Wolf Fox 8-20', plate: 'PRF-WOLF-01', type: 'Máquina', status: 'Operacional', km: 4800, fuelType: 'Diesel', brand: 'Wolf', model: 'Fox 8-20', year: 2022 },
        { id: 'cam-scania-01', name: 'Caminhão Caçamba Scania G500 XT 8x4 #01', plate: 'EXT-8891', type: 'Caminhão', status: 'Operacional', km: 92400, fuelType: 'Diesel', brand: 'Scania', model: 'G500 XT Heavy Tipper', year: 2023 },
        { id: 'cam-scania-02', name: 'Caminhão Caçamba Scania G500 XT 8x4 #02', plate: 'EXT-8892', type: 'Caminhão', status: 'Operacional', km: 86100, fuelType: 'Diesel', brand: 'Scania', model: 'G500 XT Heavy Tipper', year: 2023 },
        { id: 'cam-scania-03', name: 'Caminhão Caçamba Scania G500 XT 8x4 #03', plate: 'EXT-8893', type: 'Caminhão', status: 'Manutenção', km: 104500, fuelType: 'Diesel', brand: 'Scania', model: 'G500 XT Heavy Tipper', year: 2022 },
        { id: 'cam-bet-01', name: 'Caminhão Betoneira Mercedes-Benz Axor 3131 8m³ #01', plate: 'BET-4401', type: 'Caminhão', status: 'Em Rota', km: 74200, fuelType: 'Diesel', brand: 'Mercedes-Benz', model: 'Axor 3131B 6x4', year: 2022 },
        { id: 'cam-bet-02', name: 'Caminhão Betoneira Mercedes-Benz Axor 3131 8m³ #02', plate: 'BET-4402', type: 'Caminhão', status: 'Operacional', km: 68500, fuelType: 'Diesel', brand: 'Mercedes-Benz', model: 'Axor 3131B 6x4', year: 2022 },
        { id: 'cam-bet-03', name: 'Caminhão Betoneira VW Constellation 26.280 8m³', plate: 'BET-4403', type: 'Caminhão', status: 'Em Rota', km: 112000, fuelType: 'Diesel', brand: 'Volkswagen', model: 'Constellation 26.280', year: 2021 },
        { id: 'cam-espar-01', name: 'Caminhão Espargidor de Asfalto Térmico 6.000 L', plate: 'ESP-2020', type: 'Caminhão', status: 'Operacional', km: 45000, fuelType: 'Diesel', brand: 'Volkswagen', model: 'Constellation 17.190', year: 2021 },
        { id: 'eq-rolo-ca250', name: 'Rolo Compactador Dynapac CA250 (Terraplenagem)', plate: 'ROL-CA250', type: 'Máquina', status: 'Operacional', km: 5600, fuelType: 'Diesel', brand: 'Dynapac', model: 'CA250D', year: 2021 },
        { id: 'ut-hilux-01', name: 'Toyota Hilux Apoio Técnico & Topografia', plate: 'TEC-9090', type: 'Carro', status: 'Operacional', km: 78000, fuelType: 'Diesel', brand: 'Toyota', model: 'Hilux CD 4x4 SRX', year: 2022 }
    ];

    // 8. PNEUS INDUSTRIAIS E RODOVIÁRIOS CADASTRADOS
    const tires: Tire[] = [
        { id: 'tir-001', serialNumber: 'PN-295-01', brand: 'Michelin', model: 'X Multi D2', size: '295/80 R22.5', status: 'Em uso', currentVehicleId: 'cam-scania-01', position: '1E - Tração Externa Esquerda', installKm: 0, currentKm: 42000, maxKm: 120000, recapCount: 0, history: [] },
        { id: 'tir-002', serialNumber: 'PN-295-02', brand: 'Michelin', model: 'X Multi D2', size: '295/80 R22.5', status: 'Em uso', currentVehicleId: 'cam-scania-01', position: '1D - Tração Externa Direita', installKm: 0, currentKm: 42000, maxKm: 120000, recapCount: 0, history: [] },
        { id: 'tir-003', serialNumber: 'PN-295-03', brand: 'Bridgestone', model: 'M736', size: '295/80 R22.5', status: 'Em uso', currentVehicleId: 'cam-bet-01', position: '2E - Tração', installKm: 30000, currentKm: 68000, maxKm: 110000, recapCount: 1, history: [] },
        { id: 'tir-004', serialNumber: 'PN-295-04', brand: 'Bridgestone', model: 'M736', size: '295/80 R22.5', status: 'Em uso', currentVehicleId: 'cam-bet-01', position: '2D - Tração', installKm: 30000, currentKm: 68000, maxKm: 110000, recapCount: 1, history: [] },
        { id: 'tir-005', serialNumber: 'PN-OTR-01', brand: 'Goodyear', model: 'GP-4D L4', size: '23.5 R25', status: 'Em uso', currentVehicleId: 'eq-volvo-120a', position: 'Dianteiro Direito', installKm: 0, currentKm: 18500, maxKm: 60000, recapCount: 0, history: [] },
        { id: 'tir-006', serialNumber: 'PN-OTR-02', brand: 'Goodyear', model: 'GP-4D L4', size: '23.5 R25', status: 'Em uso', currentVehicleId: 'eq-volvo-120a', position: 'Dianteiro Esquerdo', installKm: 0, currentKm: 18500, maxKm: 60000, recapCount: 0, history: [] },
        { id: 'tir-007', serialNumber: 'PN-ESTOQUE-01', brand: 'Pirelli', model: 'FG01', size: '295/80 R22.5', status: 'Estoque', position: 'Almoxarifado de Pneus (Reserva Técnica)', installKm: 0, currentKm: 0, maxKm: 120000, recapCount: 0, history: [] }
    ];

    // 9. QUADRO DE COLABORADORES INDUSTRIAIS
    const employees: Employee[] = [
        { id: 'emp-1', name: 'Eng. Guilherme Brandão (CREA-SP 506.128)', role: 'Gerente Industrial e RT', department: 'Produção', status: 'Ativo', admissionDate: '10/01/2021', salary: 19500, email: 'guilherme@infracore.com.br', costCenter: 'Produção Industrial' },
        { id: 'emp-2', name: 'Silvio Valério de Freitas', role: 'Operador Chefe de Usina de Asfalto', department: 'Produção', status: 'Ativo', admissionDate: '01/03/2021', salary: 6200, email: 'silvio.usina@infracore.com.br', costCenter: 'Usina de Asfalto' },
        { id: 'emp-3', name: 'Marcos Vinícius Santana', role: 'Operador Chefe de Central de Concreto', department: 'Produção', status: 'Ativo', admissionDate: '15/06/2021', salary: 6000, costCenter: 'Central de Concreto' },
        { id: 'emp-4', name: 'Edilson Alencar Rocha', role: 'Operador de Britador e Mineração', department: 'Produção', status: 'Ativo', admissionDate: '10/08/2021', salary: 5400, costCenter: 'Britagem & Mina' },
        { id: 'emp-5', name: 'Dra. Vanessa Prado (Laboratorista Sênior)', role: 'Chefe de Laboratório Tecnológico', department: 'Qualidade', status: 'Ativo', admissionDate: '15/02/2022', salary: 7800, email: 'vanessa.lab@infracore.com.br', costCenter: 'Controle de Qualidade' },
        { id: 'emp-6', name: 'Severino Bezerra Cavalcante', role: 'Mecânico Chefe de Manutenção Pesada', department: 'Manutenção', status: 'Ativo', admissionDate: '20/04/2021', salary: 7400, costCenter: 'Manutenção Frota' },
        { id: 'emp-7', name: 'Claudio Roberto da Silva', role: 'Motorista de Betoneira Pesada', department: 'Logística', status: 'Ativo', admissionDate: '12/01/2022', salary: 4200, costCenter: 'Central de Concreto', cnh: '04891238910', cnhCategory: 'E', cnhExpiry: '15/10/2027' },
        { id: 'emp-8', name: 'Valdir dos Santos Ramos', role: 'Motorista de Betoneira Pesada', department: 'Logística', status: 'Ativo', admissionDate: '05/03/2022', salary: 4200, costCenter: 'Central de Concreto', cnh: '05910284911', cnhCategory: 'E', cnhExpiry: '22/04/2028' },
        { id: 'emp-9', name: 'José Aparecido Nogueira', role: 'Operador de Escavadeira 40t', department: 'Produção', status: 'Ativo', admissionDate: '01/09/2021', salary: 5800, costCenter: 'Britagem & Mina' },
        { id: 'emp-10', name: 'Patrícia Helena Dias', role: 'Supervisora de Faturamento e Balança', department: 'Comercial', status: 'Ativo', admissionDate: '15/11/2021', salary: 5200, email: 'patricia.balanca@infracore.com.br', costCenter: 'Administrativo Comercial' }
    ];

    // 10. CLIENTES CORPORATIVOS (Construtoras, Concessionárias e Prefeituras)
    const clients: Client[] = [
        {
            id: 'cli-1',
            name: 'ConstruVias Rodovias & Pavimentação S.A.',
            document: '18.490.112/0001-34',
            email: 'compras@construvias.com.br',
            phone: '(11) 4589-1000',
            status: 'Ativo',
            type: 'Matriz',
            registeredAt: '15/01/2022',
            initials: 'CVR',
            colorClass: 'bg-blue-600',
            creditLimit: 1500000,
            address: {
                street: 'Avenida das Nações Unidas',
                number: '14200',
                district: 'Morumbi',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '04794-000'
            }
        },
        {
            id: 'cli-2',
            name: 'Concessionária Rodovias do Interior S.A.',
            document: '05.912.443/0001-89',
            email: 'obras@rodoviasdointerior.com.br',
            phone: '(19) 3800-4400',
            status: 'Ativo',
            type: 'Parceiro',
            registeredAt: '10/03/2022',
            initials: 'RDI',
            colorClass: 'bg-emerald-600',
            creditLimit: 3000000
        },
        {
            id: 'cli-3',
            name: 'Prefeitura Municipal de Cajamar - Secretaria de Obras',
            document: '46.523.110/0001-09',
            email: 'licitacoes.obras@cajamar.sp.gov.br',
            phone: '(11) 4446-7700',
            status: 'Ativo',
            type: 'Parceiro',
            registeredAt: '20/04/2022',
            initials: 'PMC',
            colorClass: 'bg-amber-600',
            creditLimit: 800000
        },
        {
            id: 'cli-4',
            name: 'Gafisa & Tenda Incorporações e Engenharia',
            document: '01.554.890/0001-50',
            email: 'suprimentos.sp@incorporadora.com.br',
            phone: '(11) 3100-8000',
            status: 'Ativo',
            type: 'Parceiro',
            registeredAt: '12/08/2022',
            initials: 'GTI',
            colorClass: 'bg-purple-600',
            creditLimit: 1200000
        }
    ];

    // 11. FORNECEDORES DE INSUMOS ESTRATÉGICOS
    const suppliers: Supplier[] = [
        { id: 'sup-1', name: 'Votorantim Cimentos Brasil S.A.', document: '01.637.795/0001-57', category: 'Insumos', email: 'vendas.granel@vcimentos.com.br', phone: '0800-701-9894', status: 'Ativo', registeredAt: '10/01/2021', initials: 'VOT' },
        { id: 'sup-2', name: 'Petrobras Distribuidora (Vibra Energia) - Asfalto', document: '34.274.233/0001-02', category: 'Betume', email: 'comercial.asfaltos@vibraenergia.com.br', phone: '0800-728-9001', status: 'Ativo', registeredAt: '15/01/2021', initials: 'VIB' },
        { id: 'sup-3', name: 'Master Builders Solutions (Químicos & Aditivos)', document: '08.441.980/0001-14', category: 'Químicos', email: 'contato.aditivos@mbcc-group.com', phone: '(11) 4613-8000', status: 'Ativo', registeredAt: '01/02/2021', initials: 'MBS' },
        { id: 'sup-4', name: 'Austin Powder Brasil Explosivos e Detonação', document: '02.990.124/0001-88', category: 'Serviços', email: 'operacoes.minas@austinpowder.com.br', phone: '(31) 3514-6000', status: 'Ativo', registeredAt: '10/02/2021', initials: 'APB' },
        { id: 'sup-5', name: 'Raízen Combustíveis S.A. (Shell Diesel Pro)', document: '33.453.598/0001-23', category: 'Combustível', email: 'frotas.diesel@raizen.com.br', phone: '0800-720-1111', status: 'Ativo', registeredAt: '15/03/2021', initials: 'RAI' }
    ];

    // ARRAYS REFINADOS DE HISTÓRICO
    const transactions: Transaction[] = [];
    const sales: Sale[] = [];
    const budgets: Budget[] = [];
    const purchaseOrders: PurchaseOrder[] = [];
    const maintenanceRecords: MaintenanceRecord[] = [];
    const fuelLogs: FuelLog[] = [];
    const stockMovements: StockMovement[] = [];
    const auditLogs: AuditLog[] = [];
    const productionOrders: ProductionOrder[] = [];

    // Gerador de Histórico Diário Dinâmico
    let currentDate = new Date(startDate);
    let idCounter = 1001;

    while (currentDate <= today) {
        const dateStr = currentDate.toLocaleDateString('pt-BR');
        const day = currentDate.getDay();
        const isWorkDay = day !== 0;

        if (isWorkDay) {
            // VENDAS INDUSTRIAIS (Asfalto CBUQ, Concreto e Agregados em Grande Volume)
            if (Math.random() < 0.35) {
                const client = randomItem(clients);
                const item = randomItem(inventory.filter(i => i.price > 0));
                const qty = item.category === 'Concreto' ? randomInt(16, 80) : randomInt(40, 240);
                const value = qty * item.price;
                const saleId = `VENDA-${idCounter}`;

                sales.push({
                    id: saleId,
                    date: dateStr,
                    clientId: client.id,
                    clientName: client.name,
                    status: 'Conciliado',
                    items: [{
                        id: item.id,
                        name: item.name,
                        detail: `Fornecimento Industrial Direto (${item.location || 'Pátio'})`,
                        quantity: qty,
                        unit: item.unit,
                        price: value,
                        originalPrice: item.price,
                        originalUnit: item.unit,
                        weight: item.unit === 'ton' ? qty * 1000 : qty * 2400
                    }],
                    paymentMethod: 'Faturamento 28dd / Boleto',
                    type: 'Receita',
                    category: item.category === 'Concreto' ? '1.01.03' : item.category === 'Asfalto' ? '1.01.05' : '1.01.01',
                    description: `Fornecimento de ${item.name} (${qty} ${item.unit})`,
                    accountId: 'acc-bb',
                    amount: value
                });

                transactions.push({
                    id: `TR-${idCounter++}`,
                    date: dateStr,
                    description: `Faturamento #${saleId} - ${client.initials} (${item.name})`,
                    category: item.category === 'Concreto' ? '1.01.03' : item.category === 'Asfalto' ? '1.01.05' : '1.01.01',
                    accountId: 'acc-bb',
                    amount: value,
                    status: 'Conciliado',
                    type: 'Receita',
                    partnerId: client.id,
                    partnerName: client.name,
                    documentNumber: `NF-${idCounter}`,
                    originModule: 'Vendas',
                    originId: saleId
                });

                stockMovements.push({
                    id: `MOV-S-${idCounter}`,
                    itemId: item.id,
                    itemName: item.name,
                    type: 'Saída',
                    quantity: qty,
                    date: dateStr,
                    reason: `Venda #${saleId} para ${client.name}`,
                    documentId: saleId
                });
            }

            // ORDENS DE PRODUÇÃO INDUSTRIAL (Usinas e Britadores em operação)
            if (Math.random() < 0.28) {
                const formula = randomItem(formulas);
                const qtyProduced = formula.category === 'Concreto' ? randomInt(40, 160) : randomInt(80, 350);
                const unit = formula.category === 'Concreto' ? 'unit-conc-1' : 'unit-asf-1';

                productionOrders.push({
                    id: `OP-${idCounter++}`,
                    orderNumber: `OP-${idCounter}`,
                    productName: formula.name,
                    quantity: qtyProduced,
                    status: 'Finalizado',
                    startDate: dateStr,
                    dueDate: dateStr,
                    priority: 'Alta',
                    progress: 100,
                    formulaId: formula.id,
                    unitId: unit,
                    batch: `LT-${dateStr.replace(/\//g, '')}-${randomInt(10, 99)}`
                });
            }

            // COMPRAS ESTRATÉGICAS DE INSUMOS (Cimento, CAP, Combustíveis)
            if (Math.random() < 0.12) {
                const supplier = randomItem(suppliers);
                const item = randomItem(inventory.filter(i => i.category === 'Insumo' && i.supplierId === supplier.id));
                if (item) {
                    const qty = item.unit === 'ton' ? randomInt(30, 90) : randomInt(5000, 15000);
                    const value = qty * (item.costPrice || 100);
                    const poId = `PED-COM-${idCounter}`;

                    purchaseOrders.push({
                        id: poId,
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        date: dateStr,
                        items: [{ id: item.id, name: item.name, quantity: qty, unit: item.unit, price: value }],
                        subtotal: value,
                        total: value,
                        status: 'Recebido',
                        paymentTerms: '28 dias líquido'
                    });

                    transactions.push({
                        id: `TR-${idCounter++}`,
                        date: dateStr,
                        description: `Compra Insumo ${supplier.name} (${item.name})`,
                        category: item.name.includes('Diesel') ? '2.03.01' : '2.02.03',
                        accountId: 'acc-bb',
                        amount: value,
                        status: 'Conciliado',
                        type: 'Despesa',
                        partnerId: supplier.id,
                        partnerName: supplier.name,
                        originModule: 'Compras',
                        originId: poId
                    });

                    stockMovements.push({
                        id: `MOV-E-${idCounter}`,
                        itemId: item.id,
                        itemName: item.name,
                        type: 'Entrada',
                        quantity: qty,
                        date: dateStr,
                        reason: `Recebimento de Pedido #${poId} (${supplier.name})`,
                        documentId: poId
                    });
                }
            }

            // ABASTECIMENTO DIESEL E MANUTENÇÃO DE FROTA PESADA
            if (Math.random() < 0.3) {
                const vehicle = randomItem(fleet);
                const liters = vehicle.type === 'Caminhão' ? randomInt(180, 320) : randomInt(250, 480);
                const cost = liters * 5.75;

                fuelLogs.push({
                    id: `ABAST-${idCounter++}`,
                    vehicleId: vehicle.id,
                    date: dateStr,
                    liters,
                    cost,
                    pricePerLiter: 5.75,
                    km: vehicle.km + randomInt(50, 300),
                    fuelType: 'Diesel',
                    isPaid: true
                });

                transactions.push({
                    id: `TR-${idCounter++}`,
                    date: dateStr,
                    description: `Abastecimento Diesel S10 - ${vehicle.name} (${liters}L)`,
                    category: '2.03.01',
                    accountId: 'acc-bb',
                    amount: cost,
                    status: 'Conciliado',
                    type: 'Despesa',
                    partnerName: 'Posto Interno Usina'
                });
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Vincula logs nos veículos da frota
    fleet.forEach(v => {
        v.fuelLogs = fuelLogs.filter(f => f.vehicleId === v.id);
        v.maintenanceHistory = maintenanceRecords.filter(m => m.vehicleId === v.id);
    });

    // 12. PROPOSTAS / ORÇAMENTOS COMERCIAIS RECENTES
    budgets.push(
        {
            id: 'ORC-2026-101',
                        clientId: 'cli-1',
            clientName: 'ConstruVias Rodovias & Pavimentação S.A.',
            date: today.toLocaleDateString('pt-BR'),
            expiryDate: new Date(today.getTime() + 15 * 86400000).toLocaleDateString('pt-BR'),
            status: 'Aberto',
            subtotal: 139200.00,
            discount: 0,
            total: 139200.00,
                                    paymentMethod: 'Faturamento 28dd / Boleto Bancário',
                        items: [
                { id: 'inv-prod-cbuq-c', name: 'Massa Asfáltica CBUQ Faixa C (DNIT 031-ES)', detail: 'DNIT 031-ES Cap 50/70', quantity: 240, unit: 'ton', price: 580.00 }
            ]
        },
        {
            id: 'ORC-2026-102',
                        clientId: 'cli-4',
            clientName: 'Gafisa & Tenda Incorporações e Engenharia',
            date: today.toLocaleDateString('pt-BR'),
            expiryDate: new Date(today.getTime() + 10 * 86400000).toLocaleDateString('pt-BR'),
            status: 'Aprovado',
            subtotal: 71250.00,
            discount: 0,
            total: 71250.00,
                                    paymentMethod: 'Entrada 50% + 28 dias',
                        items: [
                { id: 'inv-prod-fck30', name: 'Concreto Usinado FCK 30 MPa Bombeável', detail: 'Slump 12+-2 Brita 1 Bombeavel', quantity: 150, unit: 'm³', price: 475.00 }
            ]
        }
    );

    // 13. REGISTROS DE FOLHA DE PAGAMENTO E PONTO CLT
    const payroll: PayrollRecord[] = [
        {
            id: 'FOLHA-2026-09',
            employeeId: 'emp-2',
            employeeName: 'Silvio Valério de Freitas',
            month: '09/2026',
            baseSalary: 6200,
            overtime: 930,
            discounts: 1323.48,
            totalNet: 5806.52,
            status: 'Pago',
            paymentDate: '05/10/2026'
        },
        {
            id: 'FOLHA-2026-09-2',
            employeeId: 'emp-7',
            employeeName: 'Claudio Roberto da Silva',
            month: '09/2026',
            baseSalary: 4200,
            overtime: 580,
            discounts: 657.30,
            totalNet: 4122.70,
            status: 'Pago',
            paymentDate: '05/10/2026'
        }
    ];

    const timeLogs: TimeLog[] = [
        { id: 'TL-01', employeeId: 'emp-2', date: today.toLocaleDateString('pt-BR'), checkIn: '07:00', lunchStart: '12:00', lunchEnd: '13:00', checkOut: '17:00', totalHours: '09:00', status: 'Regular' },
        { id: 'TL-02', employeeId: 'emp-7', date: today.toLocaleDateString('pt-BR'), checkIn: '06:30', lunchStart: '11:30', lunchEnd: '12:30', checkOut: '16:30', totalHours: '09:00', status: 'Regular' }
    ];

    const vacations: Vacation[] = [];
    const salaryAdvances: SalaryAdvance[] = [];

    // 14. LOGS DE AUDITORIA OPERACIONAL
    auditLogs.push(
        { id: 'AUD-01', userId: '1', userName: 'Admin InfraCore', action: 'Carga de Planta Industrial', module: 'Parâmetros', timestamp: `${today.toLocaleDateString('pt-BR')} 08:00`, severity: 'info', details: 'Ambiente Industrial Completo (Britagem, Asfalto, Concreto e Laboratório) inicializado com sucesso', ip: '127.0.0.1' },
        { id: 'AUD-02', userId: '1', userName: 'Admin InfraCore', action: 'Calibração de Usinas', module: 'Produção', timestamp: `${today.toLocaleDateString('pt-BR')} 08:15`, severity: 'info', details: 'Parâmetros normativos DNIT 031-ES e dosagens FCK 25/30/40 carregados', ip: '127.0.0.1' }
    );

    return {
        settings,
        employees,
        clients,
        suppliers,
        inventory,
        fleet,
        tires,
        accounts,
        planOfAccounts,
        transactions,
        sales,
        budgets,
        purchaseOrders,
        auditLogs,
        stockMovements,
        productionOrders,
        formulas,
        productionUnits,
        payroll,
        timeLogs,
        vacations,
        salaryAdvances
    };
};

// Alias para compatibilidade total com o código existente
export const generateCameloData = generateIndustrialPlantData;
