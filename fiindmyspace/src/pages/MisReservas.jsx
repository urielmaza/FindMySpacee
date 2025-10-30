import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerUser from '../components/BannerUser';
import apiClient from '../apiClient';
import { getUserSession } from '../utils/auth';
import styles from './MisReservasStyles.module.css';

// Iconos inline
const IconLocation = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
		<path d="M12 2C8.686 2 6 4.686 6 8c0 4.637 5.153 9.405 5.373 9.606a1 1 0 0 0 1.254 0C12.847 17.405 18 12.637 18 8c0-3.314-2.686-6-6-6Zm0 2a4 4 0 0 1 4 4c0 2.72-2.62 6.116-4 7.606C10.62 14.116 8 10.72 8 8a4 4 0 0 1 4-4Zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
	</svg>
);
const IconCalendar = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
		<path d="M7 2a1 1 0 0 0 0 2h1v1a1 1 0 1 0 2 0V4h4v1a1 1 0 1 0 2 0V4h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V2H7Zm12 7H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9Z" />
	</svg>
);
const IconClock = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
		<path d="M12 6V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
		<path d="M16.24 16.24L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
	</svg>
);
const IconMoney = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
		<path d="M3 7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1h1a1 1 0 1 1 0 2h-1v4h1a1 1 0 1 1 0 2h-1v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Zm2 0v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm10 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-2 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
	</svg>
);

const MisReservas = () => {
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [confirmCancel, setConfirmCancel] = useState({ open: false, reserva: null });

	useEffect(() => {
		const fetchReservas = async () => {
			try {
				const session = getUserSession();
				if (!session?.id_cliente) {
					setError('No se encontró la sesión del usuario');
					setLoading(false);
					return;
				}
				const url = `/reservas/usuario/${session.id_cliente}`;
				const resp = await apiClient.get(url);
				if (resp.data?.success) {
					setReservas(resp.data.data || []);
				} else {
					setError('No se pudieron cargar las reservas');
				}
			} catch (e) {
				console.error('Error al obtener reservas:', e);
				setError('Error al cargar las reservas');
			} finally {
				setLoading(false);
			}
		};
		fetchReservas();
	}, []);

	const formatearFechaHora = (iso) => {
		try {
			const d = new Date(iso);
			return d.toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
		} catch {
			return iso;
		}
	};

	const puedeCancelar = (r) => {
		const estado = String(r.estado || '').toLowerCase();
		const inicio = new Date(r.fecha_desde);
		const ahora = new Date();
		return (estado === 'pendiente' || estado === 'confirmada') && inicio > ahora;
	};

	const solicitarCancelacion = (reserva) => setConfirmCancel({ open: true, reserva });
	const cerrarModalCancelacion = () => setConfirmCancel({ open: false, reserva: null });

	const confirmarCancelacion = async () => {
		const r = confirmCancel.reserva;
		if (!r) return;
		try {
			const session = getUserSession();
			await apiClient.patch(`/reservas/${r.id_reserva}/cancelar`, { id_cliente: session.id_cliente });
			// Actualizar estado local
			setReservas(prev => prev.map(x => x.id_reserva === r.id_reserva ? { ...x, estado: 'cancelada' } : x));
		} catch (e) {
			console.error('Error al cancelar reserva:', e);
			alert('No se pudo cancelar la reserva.');
		} finally {
			cerrarModalCancelacion();
		}
	};

	const goReservar = () => navigate('/parkin');

	if (loading) {
		return (
			<>
				<BannerUser onMenuToggle={setIsMenuOpen} />
				<div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
					<div className={styles.contentContainer}>
						<h1 className={styles.pageTitle}>Mis Reservas</h1>
						<div className={styles.simpleCard}>Cargando reservas…</div>
					</div>
				</div>
			</>
		);
	}

	if (error) {
		return (
			<>
				<BannerUser onMenuToggle={setIsMenuOpen} />
				<div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
					<div className={styles.contentContainer}>
						<h1 className={styles.pageTitle}>Mis Reservas</h1>
						<div className={styles.errorCard}>
							<div className={styles.errorText}>{error}</div>
							<button className={styles.retryButton} onClick={() => window.location.reload()}>Reintentar</button>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<BannerUser onMenuToggle={setIsMenuOpen} />
			<div className={`${styles.pageContainer} ${isMenuOpen ? styles.pageContainerExpanded : ''}`}>
				<div className={styles.contentContainer}>
					<h1 className={styles.pageTitle}>Mis Reservas</h1>

					<div className={styles.statsContainer} style={{ marginBottom: 12 }}>
						<span className={styles.statsText}>
							Usted tiene {reservas.length} reserva{reservas.length !== 1 ? 's' : ''}
						</span>
					</div>

					<button className={styles.addButton} type="button" onClick={goReservar} aria-label="Crear nueva reserva">
						<span className={styles.addButtonIcon} aria-hidden="true">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
							</svg>
						</span>
						<span className={styles.addButtonLabel}>Nueva reserva</span>
					</button>

					{reservas.length === 0 ? (
						<div className={styles.emptyCard}>
							<h3 className={styles.emptyTitle}>No tienes reservas todavía</h3>
							<p className={styles.emptyText}>Cuando reserves un estacionamiento, aparecerá aquí.</p>
						</div>
					) : (
						<div className={styles.reservasGrid}>
							{reservas.map((r) => {
								const estado = String(r.estado || '').toLowerCase();
								return (
									<div key={r.id_reserva} className={styles.reservaCard}>
										<div className={styles.cardHeader}>
											<div className={styles.headerLeft}>
												<span className={`${styles.statusBadge} ${
													estado === 'confirmada' ? styles.statusConfirmada : estado === 'pendiente' ? styles.statusPendiente : styles.statusCancelada
												}`}>
													{r.estado}
												</span>
												<span className={styles.codigoText}>#{r.codigo}</span>
											</div>
											<div className={styles.headerRight}>
												{puedeCancelar(r) && (
													<button className={styles.cancelButton} onClick={() => solicitarCancelacion(r)} type="button">
														Cancelar
													</button>
												)}
											</div>
										</div>

										<div className={styles.infoRows}>
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}><span className={styles.icon}><IconLocation /></span> Estacionamiento:</span> {r.espacio_nombre}
											</p>
											{r.espacio_ubicacion && (
												<p className={styles.infoRow}>
													<span className={styles.infoLabel}><span className={styles.icon}><IconLocation /></span> Ubicación:</span> {r.espacio_ubicacion}
												</p>
											)}
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}><span className={styles.icon}><IconCalendar /></span> Desde:</span> {formatearFechaHora(r.fecha_desde)}
											</p>
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}><span className={styles.icon}><IconClock /></span> Hasta:</span> {formatearFechaHora(r.fecha_hasta)}
											</p>
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}>Parcela:</span> {r.parcela_numero ?? '-'}
											</p>
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}>Vehículo:</span> {r.vehiculo_patente} • {r.vehiculo_marca} {r.vehiculo_modelo}
											</p>
											<p className={styles.infoRow}>
												<span className={styles.infoLabel}><span className={styles.icon}><IconMoney /></span> Total:</span> {r.moneda} {Number(r.monto_total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
											</p>
											{r.modalidad_nombre && (
												<p className={styles.infoRow}>
													<span className={styles.infoLabel}>Modalidad:</span> {r.modalidad_nombre}
												</p>
											)}
											{r.metodo_pago_nombre && (
												<p className={styles.infoRow}>
													<span className={styles.infoLabel}>Pago:</span> {r.metodo_pago_nombre}
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{confirmCancel.open && (
				<div className={styles.confirmOverlay} role="dialog" aria-modal="true">
					<div className={styles.confirmCard}>
						<h3 className={styles.confirmTitle}>¿Cancelar reserva?</h3>
						<p className={styles.confirmText}>
							Se cancelará la reserva #{confirmCancel.reserva?.codigo}. Esta acción no se puede deshacer.
						</p>
						<div className={styles.confirmActions}>
							<button type="button" className={styles.confirmCancel} onClick={cerrarModalCancelacion}>Volver</button>
							<button type="button" className={styles.confirmDelete} onClick={confirmarCancelacion}>Cancelar reserva</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default MisReservas;
