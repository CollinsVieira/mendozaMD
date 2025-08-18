import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, FileText, Plus, Download, 
  CheckCircle, Clock, AlertCircle, Eye, Edit, Trash2
} from 'lucide-react';
import operationalService, {
  OperationalControl,
  MonthlyDeclaration,
  TaxDeclaration,
  CreateTaxDeclarationData,
  CreateAdditionalPDTData,
  AdditionalPDT
} from '../../services/operationalService';
import financeService from '../../services/financeService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Alert from '../UI/Alert';

interface PDTModalData {
  declarationId: string;
  month: number;
  monthName: string;
  isOpen: boolean;
}

interface AdditionalPDTModalData {
  isOpen: boolean;
  editingPDT?: AdditionalPDT;
}

const ClientOperational: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [operationalControl, setOperationalControl] = useState<OperationalControl | null>(null);
  const [additionalPDTs, setAdditionalPDTs] = useState<AdditionalPDT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creatingNewYear, setCreatingNewYear] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Modal states
  const [pdtModal, setPdtModal] = useState<PDTModalData>({
    declarationId: '',
    month: 0,
    monthName: '',
    isOpen: false
  });
  const [additionalPDTModal, setAdditionalPDTModal] = useState<AdditionalPDTModalData>({
    isOpen: false
  });

  // Form states
  const [pdtForm, setPdtForm] = useState({
    pdt_type: '',
    order_number: '',
    status: 'pending',
    notes: '',
    pdf_file: null as File | null
  });

  const [additionalPDTForm, setAdditionalPDTForm] = useState({
    pdt_type: '',
    pdt_name: '',
    order_number: '',
    presentation_date: '',
    status: 'pending',
    notes: '',
    pdf_file: null as File | null
  });

  const [presentationDate, setPresentationDate] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [globalPresentationDate, setGlobalPresentationDate] = useState('');

  const PDT_OPTIONS = [
    { value: 'PDT_601', label: 'PDT 601' },
    { value: 'PDT_616', label: 'PDT 616' },
    { value: 'PDT_617', label: 'PDT 617' },
    { value: 'PDT_621', label: 'PDT 621' },
  ];

  const PDT_DJ_OPTIONS = [
    { value: 'PDT_709', label: 'PDT 709' },
    { value: 'PDT_710', label: 'PDT 710' },
  ];

  const ALL_PDT_OPTIONS = [
    ...PDT_OPTIONS,
    ...PDT_DJ_OPTIONS,
    { value: 'OTHER', label: 'Otro' }
  ];

  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'presented', label: 'Presentada' },
    { value: 'observed', label: 'Observada' },
    { value: 'accepted', label: 'Aceptada' },
  ];

  useEffect(() => {
    if (id) {
      loadAvailableYears();
    }
  }, [id]);

  useEffect(() => {
    if (id && currentYear) {
      console.log('Cambiando a año operativo:', currentYear);
      loadOperationalControl();
      loadAdditionalPDTs();
    }
  }, [id, currentYear]);

  const loadOperationalControl = async () => {
    try {
      setLoading(true);
      const data = await operationalService.getOperationalControl(id!, currentYear);
      setOperationalControl(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el control operativo');
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalPDTs = async () => {
    try {
      const data = await operationalService.getAdditionalPDTs(id!, currentYear);
      setAdditionalPDTs(data);
    } catch (err: any) {
      console.error('Error loading additional PDTs:', err);
    }
  };

  const loadAvailableYears = async () => {
    if (!id) return;
    
    try {
      const yearsData = await financeService.getAvailableYears(id);
      setAvailableYears(yearsData.available_years);
    } catch (err: any) {
      console.error('Error loading available years:', err);
    }
  };

  const handleUpdatePresentationDate = async (monthDeclaration: MonthlyDeclaration) => {
    if (!presentationDate) return;

    try {
      await operationalService.updatePresentationDate(id!, {
        month: monthDeclaration.month,
        presentation_date: presentationDate,
        year: currentYear
      });
      await loadOperationalControl();
      setPresentationDate('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar fecha de presentación');
    }
  };

  const handleApplyGlobalDate = async () => {
    if (!globalPresentationDate) {
      setError('Por favor selecciona una fecha');
      return;
    }

    try {
      setLoading(true);
      
      // Aplicar la fecha a todos los meses (1-13)
      const updatePromises = [];
      for (let month = 1; month <= 13; month++) {
        updatePromises.push(
          operationalService.updatePresentationDate(id!, {
            month: month,
            presentation_date: globalPresentationDate,
            year: currentYear
          })
        );
      }

      await Promise.all(updatePromises);
      await loadOperationalControl();
      
      // Mostrar mensaje de éxito
      const successMsg = `Fecha ${new Date(globalPresentationDate).toLocaleDateString('es-ES')} aplicada a todos los meses`;
      setSuccessMessage(successMsg);
      setError(null);
      setGlobalPresentationDate('');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aplicar fecha global');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewYear = async () => {
    if (!id) return;
    
    const newYear = currentYear + 1;
    try {
      setCreatingNewYear(true);
      
      // Crear control operativo para el nuevo año
      await operationalService.getOperationalControl(id, newYear);
      
      // Actualizar el año actual y recargar
      setCurrentYear(newYear);
      await loadOperationalControl();
      await loadAdditionalPDTs();
      
      // Mostrar mensaje de éxito
      setSuccessMessage(`Año ${newYear} creado exitosamente con 13 declaraciones mensuales (12 meses + DJ Anual). Puedes configurar fechas de presentación y agregar PDTs.`);
      setError(null);
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear nuevo año');
    } finally {
      setCreatingNewYear(false);
    }
  };

  const handleCardClick = (declaration: MonthlyDeclaration) => {
    // Si la card ya está seleccionada, abrir el modal
    if (selectedCard === declaration.id) {
      openPDTModal(declaration);
    } else {
      // Seleccionar la card
      setSelectedCard(declaration.id);
    }
  };

  const openPDTModal = (declaration: MonthlyDeclaration) => {
    setPdtModal({
      declarationId: declaration.id,
      month: declaration.month,
      monthName: declaration.month_name,
      isOpen: true
    });
    setPdtForm({
      pdt_type: '',
      order_number: '',
      status: 'pending',
      notes: '',
      pdf_file: null
    });
  };

  const closePDTModal = () => {
    setPdtModal({ declarationId: '', month: 0, monthName: '', isOpen: false });
    setSelectedCard(null); // Deseleccionar la card al cerrar el modal
  };

  const handlePDTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await operationalService.createTaxDeclaration(id!, pdtModal.declarationId, { ...pdtForm, pdf_file: pdtForm.pdf_file || undefined });
      await loadOperationalControl();
      closePDTModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear declaración PDT');
    }
  };

  const handleDeleteTaxDeclaration = async (declarationId: string, taxId: string) => {
    if (!confirm('¿Está seguro de eliminar esta declaración?')) return;

    try {
      await operationalService.deleteTaxDeclaration(id!, declarationId, taxId);
      await loadOperationalControl();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar declaración');
    }
  };

  const openAdditionalPDTModal = (pdt?: AdditionalPDT) => {
    setAdditionalPDTModal({ isOpen: true, editingPDT: pdt });
    if (pdt) {
      setAdditionalPDTForm({
        pdt_type: pdt.pdt_type,
        pdt_name: pdt.pdt_name || '',
        order_number: pdt.order_number || '',
        presentation_date: pdt.presentation_date || '',
        status: pdt.status,
        notes: pdt.notes || '',
        pdf_file: null
      });
    } else {
      setAdditionalPDTForm({
        pdt_type: '',
        pdt_name: '',
        order_number: '',
        presentation_date: '',
        status: 'pending',
        notes: '',
        pdf_file: null
      });
    }
  };

  const closeAdditionalPDTModal = () => {
    setAdditionalPDTModal({ isOpen: false });
  };

  const handleAdditionalPDTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (additionalPDTModal.editingPDT) {
        await operationalService.updateAdditionalPDT(
          id!, 
          additionalPDTModal.editingPDT.id, 
          { ...additionalPDTForm, year: currentYear, pdf_file: additionalPDTForm.pdf_file || undefined }
        );
      } else {
        await operationalService.createAdditionalPDT(id!, { ...additionalPDTForm, year: currentYear, pdf_file: additionalPDTForm.pdf_file || undefined });
      }
      await loadAdditionalPDTs();
      closeAdditionalPDTModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar PDT adicional');
    }
  };

  const handleDeleteAdditionalPDT = async (pdtId: string) => {
    if (!confirm('¿Está seguro de eliminar este PDT adicional?')) return;

    try {
      await operationalService.deleteAdditionalPDT(id!, pdtId);
      await loadAdditionalPDTs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar PDT adicional');
    }
  };

  const downloadPDF = async (url: string, filename: string) => {
    try {
      const blob = await operationalService.downloadPDF(url);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError('Error al descargar el archivo');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'presented':
        return <Clock className="text-blue-600" size={16} />;
      case 'observed':
        return <AlertCircle className="text-yellow-600" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getCardStatusColor = (declarations: TaxDeclaration[], declarationId: string) => {
    const isSelected = selectedCard === declarationId;
    
    if (isSelected) {
      return 'border-blue-500 bg-blue-100 ring-2 ring-blue-300';
    }
    
    if (declarations.length === 0) return 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100';
    
    const hasAccepted = declarations.some(d => d.status === 'accepted');
    const hasPresented = declarations.some(d => d.status === 'presented');
    const hasObserved = declarations.some(d => d.status === 'observed');

    if (hasAccepted) return 'border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100';
    if (hasObserved) return 'border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:bg-yellow-100';
    if (hasPresented) return 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100';
    return 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100';
  };

  if (loading) return <LoadingSpinner />;

  if (!operationalControl) {
    return (
      <div className="p-6">
        <Alert type="error" message="No se pudo cargar el control operativo" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row flex-wrap lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/clients/${id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Volver al Cliente</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Control Operativo</h1>
          </div>
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Año:</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button
              onClick={handleCreateNewYear}
              disabled={creatingNewYear}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingNewYear ? (
                <>
                  <LoadingSpinner size="md" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Nuevo Año</span>
                </>
              )}
            </button>
            
                         {/* Indicador de Años Disponibles con Paginación */}
             <div className="flex items-center space-x-2 text-sm text-gray-600">
               <span>Años:</span>
               {availableYears.length > 0 ? (
                 <div className="flex items-center space-x-1">
                   {/* Botón Anterior */}
                                       {currentYear > Math.min(...availableYears) && (
                      <button
                        onClick={() => {
                          const currentIndex = availableYears.indexOf(currentYear);
                          const prevYear = availableYears[currentIndex - 1];
                          setCurrentYear(prevYear);
                          // No llamar loadOperationalControl() aquí, el useEffect se encargará
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        title="Año anterior"
                      >
                        ←
                      </button>
                    )}
                    
                                         {/* Año Actual */}
                     <span className="px-3 py-1 bg-blue-600 text-white rounded font-medium flex items-center space-x-2">
                       {currentYear}
                       {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                     </span>
                    
                    {/* Botón Siguiente */}
                    {currentYear < Math.max(...availableYears) && (
                      <button
                        onClick={() => {
                          const currentIndex = availableYears.indexOf(currentYear);
                          const nextYear = availableYears[currentIndex + 1];
                          setCurrentYear(nextYear);
                          // No llamar loadOperationalControl() aquí, el useEffect se encargará
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        title="Año siguiente"
                      >
                        →
                      </button>
                    )}
                   
                   {/* Contador de años */}
                   <span className="text-xs text-gray-500 ml-2">
                     {availableYears.indexOf(currentYear) + 1} de {availableYears.length}
                   </span>
                 </div>
               ) : (
                 <span className="text-gray-400">Cargando años...</span>
               )}
             </div>
            
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <label className="text-sm font-medium text-blue-700 whitespace-nowrap">
                Fecha Global:
              </label>
              <input
                type="date"
                value={globalPresentationDate}
                onChange={(e) => setGlobalPresentationDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Aplicar a todos"
              />
              <button
                onClick={handleApplyGlobalDate}
                disabled={!globalPresentationDate || loading}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <>
                    <span>Aplicar a Todos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Cliente: <span className="font-semibold">{operationalControl.client_name}</span> - Año: {currentYear}
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {successMessage && (
        <div className="mb-6">
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        </div>
      )}

      {/* Info Alert - Año Actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="text-blue-600 mr-2" size={20} />
            <div>
              <p className="text-blue-800 font-medium">Año Operativo: {currentYear}</p>
              <p className="text-blue-600 text-sm">
                {currentYear === new Date().getFullYear() ? 'Año actual' : 
                 currentYear > new Date().getFullYear() ? 'Año futuro' : 'Año anterior'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-600 text-sm">
              {availableYears.length > 0 ? `${availableYears.length} año(s) disponible(s)` : 'Cargando años...'}
            </p>
            <p className="text-blue-500 text-xs">
              {availableYears.includes(new Date().getFullYear()) ? 'Incluye año actual' : 'No incluye año actual'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Declarations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {operationalControl.monthly_declarations.map((declaration) => (
          <div
            key={declaration.id}
            onClick={() => handleCardClick(declaration)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${getCardStatusColor(declaration.tax_declarations, declaration.id)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{declaration.month_name}</h3>
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-500" />
                {selectedCard === declaration.id && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Fecha de presentación */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Presentación
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={declaration.presentation_date || presentationDate}
                  onChange={(e) => {
                    e.stopPropagation();
                    setPresentationDate(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePresentationDate(declaration);
                  }}
                  disabled={!presentationDate}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  ✓
                </button>
              </div>
            </div>

            {/* PDTs del mes */}
            <div className="space-y-2 mb-3">
              {declaration.tax_declarations.map((tax) => (
                <div key={tax.id} className="bg-white p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tax.status)}
                      <span className="text-sm font-medium">{tax.pdt_type_display}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {tax.pdf_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPDF(tax.pdf_url!, `${tax.pdt_type_display}_${tax.order_number}.pdf`);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Descargar PDF"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTaxDeclaration(declaration.id, tax.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {tax.order_number && (
                    <p className="text-xs text-gray-600 mt-1">Orden: {tax.order_number}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="text-sm text-gray-600 mb-3">
              <p>PDTs registrados: {declaration.tax_declarations.length}</p>
              {declaration.tax_declarations.length > 0 && (
                <p>Estado: {declaration.tax_declarations.some(d => d.status === 'accepted') ? 'Completado' : 'En proceso'}</p>
              )}
            </div>

            {/* Indicador de selección */}
            <div className="text-center">
              {selectedCard === declaration.id ? (
                <p className="text-blue-600 font-medium text-sm">
                  Haz clic nuevamente para agregar PDT
                </p>
              ) : (
                <p className="text-gray-500 text-sm">
                  Haz clic para seleccionar
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PDTs Adicionales Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">PDTs Adicionales</h2>
          <button
            onClick={() => openAdditionalPDTModal()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Agregar PDT Adicional</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {additionalPDTs.map((pdt) => (
            <div key={pdt.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  {pdt.pdt_type === 'OTHER' ? pdt.pdt_name : pdt.pdt_type_display}
                </h3>
                <div className="flex items-center space-x-1">
                  {pdt.pdf_url && (
                    <button
                      onClick={() => downloadPDF(pdt.pdf_url!, `${pdt.pdt_name || pdt.pdt_type_display}_${pdt.order_number}.pdf`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Descargar PDF"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => openAdditionalPDTModal(pdt)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAdditionalPDT(pdt.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {pdt.order_number && <p>Orden: {pdt.order_number}</p>}
                {pdt.presentation_date && <p>Fecha: {new Date(pdt.presentation_date).toLocaleDateString('es-ES')}</p>}
                <div className="flex items-center space-x-1">
                  {getStatusIcon(pdt.status)}
                  <span>{pdt.status_display}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {additionalPDTs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-2 opacity-50" />
            <p>No hay PDTs adicionales registrados</p>
          </div>
        )}
      </div>

      {/* Modal para PDT Mensual */}
      {pdtModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Agregar PDT - {pdtModal.monthName}
            </h3>

            <form onSubmit={handlePDTSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de PDT
                </label>
                <select
                  value={pdtForm.pdt_type}
                  onChange={(e) => setPdtForm({ ...pdtForm, pdt_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccione un PDT</option>
                  {(pdtModal.month === 13 ? PDT_DJ_OPTIONS : PDT_OPTIONS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Orden
                </label>
                <input
                  type="text"
                  value={pdtForm.order_number}
                  onChange={(e) => setPdtForm({ ...pdtForm, order_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ingrese el número de orden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={pdtForm.status}
                  onChange={(e) => setPdtForm({ ...pdtForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Constancia PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdtForm({ ...pdtForm, pdf_file: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={pdtForm.notes}
                  onChange={(e) => setPdtForm({ ...pdtForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closePDTModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar PDT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para PDT Adicional */}
      {additionalPDTModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {additionalPDTModal.editingPDT ? 'Editar' : 'Agregar'} PDT Adicional
            </h3>

            <form onSubmit={handleAdditionalPDTSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de PDT
                </label>
                <select
                  value={additionalPDTForm.pdt_type}
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, pdt_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccione un PDT</option>
                  {ALL_PDT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {additionalPDTForm.pdt_type === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del PDT
                  </label>
                  <input
                    type="text"
                    value={additionalPDTForm.pdt_name}
                    onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, pdt_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ingrese el nombre del PDT"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Orden
                </label>
                <input
                  type="text"
                  value={additionalPDTForm.order_number}
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, order_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ingrese el número de orden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Presentación
                </label>
                <input
                  type="date"
                  value={additionalPDTForm.presentation_date}
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, presentation_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={additionalPDTForm.status}
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Constancia PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, pdf_file: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={additionalPDTForm.notes}
                  onChange={(e) => setAdditionalPDTForm({ ...additionalPDTForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAdditionalPDTModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {additionalPDTModal.editingPDT ? 'Actualizar' : 'Crear'} PDT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOperational;
