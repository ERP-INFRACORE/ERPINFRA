import React, { useState } from 'react';
import {
  Search,
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
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Client, Supplier, Employee, InventoryItem, FleetVehicle } from '../types';
import { exportToCSV } from '../utils/exportUtils';

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
      case 'products': return hasPermission('inventory.create') || hasPermission('inventory.edit') || hasPermission('inventory.manage');
      case 'vehicles': return hasPermission('fleet.manage');
      default: return false;
    }
  };

  const getInitialFormData = (type: string) => {
    switch (type) {
      case 'clients': return { status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR'), colorClass: 'bg-cyan-100 text-cyan-600', type: 'Matriz' };
      case 'suppliers': return { status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR') };
      case 'employees': return { status: 'Ativo', admissionDate: new Date().toLocaleDateString('pt-BR') };
      case 'products': return { quantity: 0, minStock: 10, price: 0, costPrice: 0, unit: 'un' };
      case 'vehicles': return { status: 'Operacional', fuelLevel: 100, lastMaintenance: new Date().toLocaleDateString('pt-BR') };
      default: return {};
    }
  };

  const handleOpenModal = (item?: any, type: string = activeTab) => {
    setActiveTab(type);
    if (item) {
      setEditingId(item.id);
      setFormData(type === 'vehicles' ? { ...item, name: item.model } : item);
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
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || Date.now().toString();

    if (activeTab === 'clients') {
      const client: Client = { ...formData, id, initials: formData.name.substring(0, 2).toUpperCase() };
      if (editingId) updateClient(client); else addClient(client);
    } else if (activeTab === 'suppliers') {
      const supplier: Supplier = { ...formData, id, initials: formData.name.substring(0, 2).toUpperCase() };
      if (editingId) updateSupplier(supplier); else addSupplier(supplier);
    } else if (activeTab === 'employees') {
      const employee: Employee = { ...formData, id };
      if (editingId) updateEmployee(employee); else addEmployee(employee);
    } else if (activeTab === 'products') {
      const product: InventoryItem = {
        ...formData,
        id: editingId || `p-${Date.now()}`,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        minStock: parseFloat(formData.minStock) || 0
      };
      if (editingId) updateStockItem(product); else addStockItem(product);
    } else if (activeTab === 'vehicles') {
      const vehicleName = formData.name || formData.model || 'Veículo';
      const vehicle: FleetVehicle = { ...formData, name: vehicleName, model: vehicleName, id: editingId || `v-${Date.now()}`, fuelLevel: parseFloat(formData.fuelLevel) || 0 };
      if (editingId) updateVehicle(vehicle); else addVehicle(vehicle);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    addToast('Tem certeza que deseja excluir este registro?', 'warning', 5000, {
      label: 'EXCLUIR',
      onClick: () => {
        if (activeTab === 'clients') deleteClient(id);
        else if (activeTab === 'suppliers') deleteSupplier(id);
        else if (activeTab === 'employees') deleteEmployee(id);
        else if (activeTab === 'products') deleteStockItem(id);
        else if (activeTab === 'vehicles') deleteVehicle(id);
      }
    });
  };

  const handleDuplicate = (item: any) => {
    const duplicatedItem = { ...item };
    delete duplicatedItem.id; // Ensure new ID generation
    duplicatedItem.name = `${duplicatedItem.name} (Cópia)`; // Alter reference (Name)
    if (duplicatedItem.barcode) duplicatedItem.barcode = ''; // Clear unique identifier if exists

    setEditingId(null);
    setFormData(duplicatedItem);
    setIsModalOpen(true);
  };

  const TabButton = ({ id, icon: Icon, label, count }: any) => (
    <button
      onClick={() => { setActiveTab(id); setSearchTerm(''); }}
      className={`border-b-2 pb-2 text-sm font-medium flex items-center gap-2 transition-all ${activeTab === id ? 'border-cyan-500 text-cyan-600 font-bold' : 'border-transparent text-gray-400 font-medium'}`}
    >
      <Icon size={18} /> {label}
      {count !== undefined && <span className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full text-[10px] ml-1">{count}</span>}
    </button>
  );

  const getFilteredItems = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'clients') return clients.filter(c => c.name.toLowerCase().includes(term));
    if (activeTab === 'suppliers') return suppliers.filter(s => s.name.toLowerCase().includes(term));
    if (activeTab === 'employees') return employees.filter(e => e.name.toLowerCase().includes(term));
    if (activeTab === 'products') return inventory.filter(p => p.name.toLowerCase().includes(term));
    if (activeTab === 'vehicles') return fleet.filter(v => (v.model || '').toLowerCase().includes(term) || (v.plate || '').toLowerCase().includes(term));
    return [];
  };

  const filteredItems = getFilteredItems();

  const handleExport = () => exportToCSV(filteredItems, `Export_${activeTab}`);

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
                  {activeTab === 'vehicles' && 'Veículo da Frota'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"><X size={24} /></button>
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
                        {activeTab === 'products' ? 'Descrição do Produto' : activeTab === 'vehicles' ? 'Modelo / Nome do Veículo' : 'Nome Completo / Razão Social'}
                      </label>
                      <input
                        type="text" required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder={activeTab === 'clients' ? 'Ex: Construtora Exemplo Ltda' : activeTab === 'vehicles' ? 'Ex: Volvo FH 540' : ''}
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 transition-all appearance-none"
                        value={formData.status || 'Ativo'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Ativo">Ativo / Disponível</option>
                        <option value="Inativo">Inativo / Indisponível</option>
                        {activeTab === 'suppliers' && <option value="Bloqueado">Bloqueado</option>}
                        {activeTab === 'employees' && <option value="Férias">Em Férias</option>}
                        {activeTab === 'vehicles' && <option value="Manutenção">Em Manutenção</option>}
                      </select>
                      {/* Campo Adicional: Nome Fantasia (Fornecedor) */}
                      {activeTab === 'suppliers' && (
                        <div className="md:col-span-12">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nome Fantasia</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.tradeName || ''}
                            onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {/* Campos Específicos por Tipo */}

                    {/* -> CLIENTES & FORNECEDORES & COLABORADORES */}
                    {(activeTab === 'clients' || activeTab === 'suppliers' || activeTab === 'employees') && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">CPF / CNPJ</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                            value={formData.document || ''} onChange={e => setFormData({ ...formData, document: e.target.value })}
                            placeholder="00.000.000/0000-00" />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Principal</label>
                          <input type="email" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                            value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Telefone / WhatsApp</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                            value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </>
                    )}

                    {/* -> PRODUTOS */}
                    {activeTab === 'products' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca / Fabricante</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoria</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} list="categories-list" />
                          <datalist id="categories-list">
                            <option value="Agregados" />
                            <option value="Cimentos e Argamassas" />
                            <option value="Aços e Metais" />
                            <option value="Madeiras" />
                            <option value="Tubos e Conexões" />
                            <option value="Material Elétrico" />
                            <option value="Material Hidráulico" />
                            <option value="Tintas e Solventes" />
                            <option value="Revestimentos e Pisos" />
                            <option value="Telhas e Coberturas" />
                            <option value="Ferramentas Manuais" />
                            <option value="Ferramentas Elétricas" />
                            <option value="EPIs - Proteção Individual" />
                            <option value="Peças de Reposição" />
                            <option value="Manutenção em Geral" />
                            <option value="Combustíveis e Óleos" />
                            <option value="Pneus e Rodagem" />
                            <option value="Serviços Terceirizados" />
                            <option value="Locação de Equipamentos" />
                            <option value="Insumos Administrativos" />
                          </datalist>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Código de Barras (EAN)</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
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
                            value={formData.year || ''} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Placa</label>
                          <input type="text" className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-700/50 rounded-xl p-3 text-lg font-black text-center uppercase tracking-widest text-emerald-700 dark:text-emerald-400"
                            value={formData.plate || ''} onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" maxLength={8} />
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
                            value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                        </div>
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Inscrição Estadual</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.stateReg || ''} onChange={e => setFormData({ ...formData, stateReg: e.target.value })} />
                        </div>
                        {activeTab === 'clients' && (
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Limite de Crédito (R$)</label>
                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-emerald-600"
                              value={formData.creditLimit || ''} onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })} />
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
                          <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} />
                        </div>
                      </>
                    )}

                    {/* ADICIONAIS: Produtos */}
                    {activeTab === 'products' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Preço de Venda (R$)</label>
                          <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-emerald-600"
                            value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Preço de Custo (R$)</label>
                          <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium text-slate-500"
                            value={formData.costPrice || ''} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Estoque Atual</label>
                          <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold"
                            value={formData.quantity || ''} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unidade de Medida</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.unit || 'un'} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                            <option value="un">Unidade (un)</option>
                            <option value="kg">Quilo (kg)</option>
                            <option value="m">Metro (m)</option>
                            <option value="m2">Metro² (m²)</option>
                            <option value="m3">Metro³ (m³)</option>
                            <option value="sc">Saco (sc)</option>
                            <option value="l">Litro (l)</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Estoque Mínimo (Alerta)</label>
                          <input type="number" step="0.01" className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl p-3 text-sm font-bold text-rose-600"
                            value={formData.minStock || ''} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Peso Unitário (kg)</label>
                          <input type="number" step="0.001" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Localização (Rua/Box)</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                      </>
                    )}

                    {/* ADICIONAIS: Veículos (Detalhes Operacionais) */}
                    {activeTab === 'vehicles' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kilometragem Atual (Km)</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.km || ''} onChange={e => setFormData({ ...formData, km: parseFloat(e.target.value) })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Próx. Manutenção (Km)</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium text-amber-600"
                            value={formData.nextMaintenanceKm || ''} onChange={e => setFormData({ ...formData, nextMaintenanceKm: parseFloat(e.target.value) })} />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Combustível</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium"
                            value={formData.fuelType || ''} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}>
                            <option value="Diesel">Diesel</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Etanol">Etanol</option>
                            <option value="Flex">Flex</option>
                            <option value="Hibrido">Híbrido</option>
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
                            {employees.map(emp => (
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
                            <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              value={formData.address?.zipCode || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })} />
                          </div>
                          <div className="col-span-4 md:col-span-4">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Logradouro (Rua/Av)</label>
                            <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              value={formData.address?.street || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Número</label>
                            <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              value={formData.address?.number || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })} />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Bairro</label>
                            <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              value={formData.address?.district || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                            <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700"
                              value={formData.address?.city || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">UF</label>
                            <input type="text" maxLength={2} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700 uppercase"
                              value={formData.address?.state || ''} onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} />
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

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-1">Cadastros Centrais</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Gestão Operacional</h2>
        </div>
        {canManage(activeTab) && (
          <button onClick={() => handleOpenModal()} className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
            <Plus size={20} /> Adicionar Novo
          </button>
        )}
      </div>

      <div className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex gap-8 overflow-x-auto pb-0">
          <TabButton id="clients" icon={User} label="Clientes" count={clients.length} />
          <TabButton id="suppliers" icon={Warehouse} label="Fornecedores" count={suppliers.length} />
          <TabButton id="employees" icon={Badge} label="Colaboradores" count={employees.length} />
          <TabButton id="products" icon={Package} label="Produtos" count={inventory.length} />
          <TabButton id="vehicles" icon={Truck} label="Veículos" count={fleet.length} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={20} />
          <input className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-3xl shadow-sm focus:ring-2 focus:ring-cyan-500 transition-all text-sm" placeholder={`Pesquisar em ${activeTab}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={handleExport} className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-2xl shadow-sm transition-all border border-transparent hover:border-emerald-100"><Download size={20} /></button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Info</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {filteredItems.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-black text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                      {item.initials || (item.name || item.model || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name || item.model}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tabular-nums">{item.document || item.plate || 'REF-' + item.id.slice(-4)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Ativo' || item.status === 'Operacional' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.status || 'Ativo'}
                  </span>
                  {item.attachments?.length > 0 && <span className="ml-2 text-[9px] font-bold text-cyan-600 uppercase flex items-center gap-1"><Paperclip size={10} /> {item.attachments.length} Anexos</span>}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeTab === 'products' && canManage('products') && (
                      <button onClick={() => handleDuplicate(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Duplicar"><Copy size={18} /></button>
                    )}
                    {canManage(activeTab) && (
                      <>
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default Clients;