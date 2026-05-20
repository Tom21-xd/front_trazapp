'use client';

import { useEffect, useState, useCallback } from 'react';
import { stageChangesService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Button, Card, CardContent, Badge, Modal, Textarea, useToast, Pagination } from '@/components/ui';
import { stageChangeStatusColors, formatDateTime } from '@/lib/utils';
import type { StageChangeRequest, ReviewStageChangeDto, PageMeta } from '@/types';

export default function StageChangesPage() {
  const { can } = useAuthContext();
  const canReview = can('stagechange:review');
  const toast = useToast();
  const [requests, setRequests] = useState<StageChangeRequest[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<StageChangeRequest | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewStageChangeDto>({ status: 'APROBADO', reviewComment: '' });
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const res = canReview
        ? await stageChangesService.getPendingPage({ page })
        : await stageChangesService.getMyRequestsPage({ page });
      setRequests(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, [canReview, page, toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSaving(true);
    try {
      await stageChangesService.review(selectedRequest.id, reviewForm);
      setSelectedRequest(null);
      setReviewForm({ status: 'APROBADO', reviewComment: '' });
      toast.success('Solicitud revisada correctamente');
      loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo revisar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">
          {canReview ? 'Solicitudes pendientes' : 'Mis solicitudes'}
        </h1>
        <p className="text-sm lg:text-base text-accent-500">
          {canReview ? 'Revisa y aprueba cambios de etapa' : 'Historial de tus solicitudes de cambio'}
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">Sin solicitudes</h3>
            <p className="text-accent-500">No hay solicitudes de cambio de etapa</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-accent-900 wrap-break-word">{request.activity?.title}</h3>
                      <Badge className={stageChangeStatusColors[request.status]}>{request.status}</Badge>
                    </div>
                    <p className="text-sm text-accent-500 mb-3 wrap-break-word">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-accent-500">De:</span>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: request.fromStage?.color || '#e5e5e5' }}
                        >
                          {request.fromStage?.name}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div className="flex items-center gap-2">
                        <span className="text-accent-500">A:</span>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: request.toStage?.color || '#e5e5e5' }}
                        >
                          {request.toStage?.name}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-accent-400">
                      Solicitado por {request.requestedBy?.name} • {formatDateTime(request.createdAt)}
                    </div>
                  </div>
                  {canReview && request.status === 'PENDIENTE' && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="w-full sm:w-auto shrink-0"
                    >
                      Revisar
                    </Button>
                  )}
                </div>

                {request.reviewComment && (
                  <div className="mt-4 p-3 bg-accent-50 rounded-lg">
                    <p className="text-xs text-accent-500 mb-1">Comentario del revisor:</p>
                    <p className="text-sm text-accent-700">{request.reviewComment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && requests.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Revisar solicitud"
        subtitle="Aprueba o rechaza el cambio de etapa solicitado"
        size="2xl"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setSelectedRequest(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="review-request-form"
              loading={saving}
              variant={reviewForm.status === 'APROBADO' ? 'primary' : 'danger'}
            >
              {reviewForm.status === 'APROBADO' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
            </Button>
          </>
        }
      >
        <form id="review-request-form" onSubmit={handleReview} className="space-y-6">
          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Solicitud
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Detalle enviado por el solicitante
              </p>
            </div>
            <div className="p-4 bg-accent-50 rounded-lg border border-accent-100">
              <p className="font-medium text-accent-900 mb-1">
                {selectedRequest?.activity?.title}
              </p>
              <p className="text-sm text-accent-600 whitespace-pre-wrap">
                {selectedRequest?.description}
              </p>
            </div>
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Decisión
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Selecciona si autorizas el cambio de etapa
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label>
                <input
                  type="radio"
                  name="status"
                  value="APROBADO"
                  checked={reviewForm.status === 'APROBADO'}
                  onChange={() => setReviewForm({ ...reviewForm, status: 'APROBADO' })}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 rounded-xl cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:ring-2 peer-checked:ring-primary-200 border-accent-200 hover:border-accent-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-accent-900">Aprobar</p>
                      <p className="text-sm text-accent-500">La actividad cambiará de etapa</p>
                    </div>
                  </div>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="status"
                  value="RECHAZADO"
                  checked={reviewForm.status === 'RECHAZADO'}
                  onChange={() => setReviewForm({ ...reviewForm, status: 'RECHAZADO' })}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 rounded-xl cursor-pointer peer-checked:border-secondary-500 peer-checked:bg-secondary-50 peer-checked:ring-2 peer-checked:ring-secondary-200 border-accent-200 hover:border-accent-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-accent-900">Rechazar</p>
                      <p className="text-sm text-accent-500">La actividad permanecerá en su etapa</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <Textarea
              id="reviewComment"
              label="Comentario (opcional)"
              value={reviewForm.reviewComment || ''}
              onChange={(e) => setReviewForm({ ...reviewForm, reviewComment: e.target.value })}
              placeholder="Agrega un comentario sobre tu decisión..."
              rows={3}
            />
          </section>
        </form>
      </Modal>
    </div>
  );
}
