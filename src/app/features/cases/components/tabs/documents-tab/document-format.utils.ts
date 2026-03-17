import { DocumentType } from '../../../models/case.model';

export function iconForType(fileType: string): string {
  if (fileType === 'pdf') return 'heroDocument';
  if (['jpg', 'jpeg', 'png', 'gif', 'image'].includes(fileType)) return 'heroPhoto';
  return 'heroPaperClip';
}

export function colorForType(fileType: string): string {
  if (fileType === 'pdf') return 'text-red-400';
  if (['docx', 'doc'].includes(fileType)) return 'text-blue-400';
  if (['jpg', 'jpeg', 'png', 'gif', 'image'].includes(fileType)) return 'text-purple-400';
  return 'text-gray-400';
}

export function bgForType(fileType: string): string {
  if (fileType === 'pdf') return 'bg-red-50';
  if (['docx', 'doc'].includes(fileType)) return 'bg-blue-50';
  if (['jpg', 'jpeg', 'png', 'gif', 'image'].includes(fileType)) return 'bg-purple-50';
  return 'bg-gray-50';
}

export function docTypeLabelShort(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    escrito: 'Escrito', contrato: 'Contrato', sentencia: 'Sentencia',
    pericia: 'Pericia', notificacion: 'Cédula', poder: 'Poder',
    factura: 'Factura', correspondencia: 'Corresp.', prueba: 'Prueba', otro: 'Otro',
  };
  return map[type] ?? type;
}

export function docTypeCls(type: DocumentType): string {
  const map: Partial<Record<DocumentType, string>> = {
    escrito:         'bg-blue-100 text-blue-700',
    contrato:        'bg-violet-100 text-violet-700',
    sentencia:       'bg-amber-100 text-amber-700',
    pericia:         'bg-teal-100 text-teal-700',
    notificacion:    'bg-orange-100 text-orange-700',
    poder:           'bg-indigo-100 text-indigo-700',
    factura:         'bg-green-100 text-green-700',
    correspondencia: 'bg-gray-100 text-gray-600',
    prueba:          'bg-pink-100 text-pink-700',
    otro:            'bg-gray-100 text-gray-600',
  };
  return map[type] ?? 'bg-gray-100 text-gray-600';
}

export function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}
