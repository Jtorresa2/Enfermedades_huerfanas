import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { IExpedienteClinico } from '../types/clinical';

interface KpiCardsProps {
  expedientes: IExpedienteClinico[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ expedientes }) => {
  const total = expedientes.length;
  const conformes = expedientes.filter(e => e.auditoria.estado === 'CONFORME').length;
  const incompletos = expedientes.filter(e => e.auditoria.estado === 'INCOMPLETO').length;
  const criticos = expedientes.filter(e => e.auditoria.estado === 'CRITICO').length;

  const pctCumplimiento = total > 0 ? Math.round((conformes / total) * 100) : 0;

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-data">
          <p>Expedientes en Cohorte</p>
          <h2>{total}</h2>
          <small>Fichas clínicas analizadas</small>
        </div>
        <div className="kpi-icon-wrapper kpi-blue">
          <FileText size={24} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-data">
          <p>Cumplimiento Normativo</p>
          <h2>{pctCumplimiento}%</h2>
          <small>{conformes} conformes ante MinSalud</small>
        </div>
        <div className="kpi-icon-wrapper kpi-green">
          <CheckCircle2 size={24} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-data">
          <p>Expedientes Incompletos</p>
          <h2>{incompletos}</h2>
          <small>Faltan CUPS o SIVIGILA 342</small>
        </div>
        <div className="kpi-icon-wrapper kpi-amber">
          <AlertTriangle size={24} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-data">
          <p>Hallazgos Críticos</p>
          <h2>{criticos}</h2>
          <small>Sin prueba confirmatoria</small>
        </div>
        <div className="kpi-icon-wrapper kpi-red">
          <XCircle size={24} />
        </div>
      </div>
    </div>
  );
};
