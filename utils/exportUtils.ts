/**
 * Utility for exporting data to CSV format compatible with Microsoft Excel.
 * Handles UTF-8 with BOM for correct character encoding in Portuguese.
 */

export const exportToCSV = (data: any[], fileName: string, customHeaders?: string[]) => {
    if (!data || !data.length) {
        alert("Nenhum dado disponível para exportar.");
        return;
    }

    // Use custom headers if provided, otherwise grab keys from the first object
    const headers = customHeaders || Object.keys(data[0]);

    // Format rows
    const csvContent = [
        headers.join(';'), // Excel in some locales (like PT-BR) prefers semicolon
        ...data.map(row =>
            headers.map(header => {
                let value = row[header] ?? '';

                // Handle numbers: format decimals with comma for PT-BR Excel
                if (typeof value === 'number') {
                    value = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
                } else if (typeof value === 'string') {
                    // Handle values that might contain semicolon, newlines or quotes
                    value = value.replace(/"/g, '""'); // Escape double quotes
                    if (value.includes(';') || value.includes('\n') || value.includes('"') || value.includes(',')) {
                        value = `"${value}"`;
                    }
                } else if (Array.isArray(value)) {
                    // Handle arrays (like items in an order)
                    value = `"${value.map(v => v.name || v.description || v).join(', ').replace(/"/g, '""')}"`;
                } else if (typeof value === 'object' && value !== null) {
                    value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }

                return value;
            }).join(';')
        )
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportCustomTableToCSV = (headers: string[], rows: (string | number)[][], fileName: string, metadataHeader?: string) => {
    const csvContent = [
        ...(metadataHeader ? [metadataHeader, ''] : []),
        headers.join(';'),
        ...rows.map(row =>
            row.map(cell => {
                let val = cell ?? '';
                if (typeof val === 'number') {
                    val = Number.isInteger(val) ? String(val) : val.toFixed(2).replace('.', ',');
                } else if (typeof val === 'string') {
                    val = val.replace(/"/g, '""');
                    if (val.includes(';') || val.includes('\n') || val.includes('"')) {
                        val = `"${val}"`;
                    }
                }
                return val;
            }).join(';')
        )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportDashboardToExcel = (contextData: any) => {
    const { financials, transactions = [], sales = [], employees = [], inventory = [], fleet = [], settings } = contextData || {};

    const companyName = settings?.companyName || 'InfraCore Engenharia e Tecnologia Ltda';
    const cnpj = settings?.document || '12.345.678/0001-99';
    const today = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR');

    const totalRevenue = financials?.totalRevenue || transactions.filter((t: any) => t.type === 'Receita').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const totalExpenses = financials?.totalExpenses || transactions.filter((t: any) => t.type === 'Despesa').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const currentBalance = financials?.balance ?? (totalRevenue - totalExpenses);
    const receivables = financials?.receivables || 0;
    const payables = financials?.payables || 0;
    const totalInventoryValue = inventory.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    const fmt = (val: number) => val.toFixed(2).replace('.', ',');

    const sections = [
        `# =========================================================================`,
        `# RELATÓRIO EXECUTIVO CONSOLIDADO (BI DASHBOARD)`,
        `# Empresa: ${companyName} | CNPJ: ${cnpj}`,
        `# Data de Emissão: ${today} às ${time}`,
        `# =========================================================================`,
        ``,
        `# --- 1. INDICADORES FINANCEIROS GERAIS ---`,
        `Métrica;Valor Apurado (R$);Status`,
        `Faturamento Bruto Consolidado;${fmt(totalRevenue)};Auditado`,
        `Despesas Operacionais Totais;${fmt(totalExpenses)};Auditado`,
        `Saldo em Contas / Disponibilidade;${fmt(currentBalance)};Auditado`,
        `Títulos a Receber Previstos;${fmt(receivables)};Em Aberto`,
        `Títulos a Pagar Pendentes;${fmt(payables)};Em Aberto`,
        `Capital de Giro Líquido Estimado;${fmt(currentBalance + receivables - payables)};Calculado`,
        ``,
        `# --- 2. SÍNTESE PATRIMONIAL E OPERACIONAL ---`,
        `Departamento / Ativo;Quantidade;Valor Total (R$)`,
        `Clientes Cadastrados;${contextData?.clients?.length || 0};-`,
        `Vendas Registradas;${sales.length};${fmt(sales.reduce((s: number, x: any) => s + (x.amount || 0), 0))}`,
        `Itens em Catálogo de Estoque;${inventory.length};${fmt(totalInventoryValue)}`,
        `Veículos da Frota Operacional;${fleet.length};-`,
        `Quadro de Colaboradores;${employees.length};${fmt(employees.reduce((s: number, e: any) => s + (e.salary || 0), 0))}`,
        ``,
        `# --- 3. ÚLTIMAS TRANSAÇÕES FINANCEIRAS ---`,
        `Data;Descrição;Categoria;Tipo;Valor (R$);Status;Conta`,
        ...transactions.slice(0, 50).map((t: any) =>
            `${t.date || ''};"${(t.description || '').replace(/"/g, '""')}";"${(t.ledgerName || t.category || '').replace(/"/g, '""')}";${t.type || ''};${fmt(t.amount || 0)};${t.status || ''};"${(t.account || '').replace(/"/g, '""')}"`
        )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + sections], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Resumo_Executivo_BI_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const printDocument = (title: string, htmlContent: string, options?: { orientation?: 'portrait' | 'landscape' }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Por favor, permita pop-ups para imprimir documentos.");
        return;
    }

    const orientation = options?.orientation || 'portrait';
    const trimmed = htmlContent.trim().toLowerCase();
    const isFullDocument = trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');

    if (isFullDocument) {
        // If content is already a full HTML document, write it directly and ensure window.print is called
        let finalHtml = htmlContent;

        // Apply landscape orientation if requested
        if (orientation === 'landscape' && finalHtml.includes('size: A4 portrait')) {
            finalHtml = finalHtml.replace('size: A4 portrait;', 'size: A4 landscape; margin: 12mm;');
        }

        if (!finalHtml.includes('window.print()')) {
            const printScript = `
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            `;
            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', `${printScript}</body>`);
            } else {
                finalHtml += printScript;
            }
        }

        printWindow.document.open();
        printWindow.document.write(finalHtml);
        printWindow.document.close();
        return;
    }

    // Default template for HTML fragments/snippets (Sales, Purchases, Production, etc.)
    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    padding: 40px; 
                    color: #1e293b; 
                    line-height: 1.5;
                }
                .header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start;
                    border-bottom: 4px solid #0891b2; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px; 
                }
                .company-info h1 { margin: 0; color: #0891b2; font-weight: 900; font-size: 28px; }
                .doc-info { text-align: right; }
                .doc-info h2 { margin: 0; font-size: 20px; text-transform: uppercase; color: #64748b; }
                .details-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 40px; 
                    margin-bottom: 40px;
                }
                .detail-box h3 { 
                    font-size: 12px; 
                    text-transform: uppercase; 
                    color: #94a3b8; 
                    margin-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 4px;
                }
                .detail-box p { margin: 4px 0; font-weight: bold; }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 30px 0; 
                }
                th { 
                    background-color: #f8fafc; 
                    text-align: left; 
                    padding: 12px; 
                    font-size: 10px; 
                    text-transform: uppercase; 
                    color: #64748b;
                    border-bottom: 2px solid #e2e8f0;
                }
                td { 
                    padding: 12px; 
                    border-bottom: 1px solid #f1f5f9; 
                    font-size: 14px; 
                }
                .text-right { text-align: right; }
                .totals { 
                    margin-left: auto; 
                    width: 300px;
                    margin-top: 20px;
                }
                .total-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 8px 0;
                }
                .total-final { 
                    border-top: 2px solid #0891b2;
                    margin-top: 10px;
                    padding-top: 10px;
                    font-size: 22px;
                    font-weight: 900;
                    color: #0891b2;
                }
                .footer { 
                    margin-top: 100px; 
                    border-top: 1px solid #e2e8f0; 
                    padding-top: 20px; 
                    font-size: 10px; 
                    color: #94a3b8; 
                    text-align: center; 
                }
                @media print {
                    @page { 
                        size: A4 ${orientation}; 
                        margin: 15mm; 
                    }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <div class="footer">
                Documento gerado eletronicamente por InfraCore ERP - ${new Date().toLocaleString('pt-BR')}
            </div>
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
