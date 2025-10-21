import React, { useState } from 'react';
import BannerUser from '../components/BannerUser';
import './MisReservas.Module.css';

const MisReservas = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<>
			<BannerUser onMenuToggle={setIsMenuOpen} />
					<div className={`pageContainer ${isMenuOpen ? 'pageContainerExpanded' : ''}`}>
						<div className="contentContainer">
							<h1 className="pageTitle">Mis Reservas</h1>
							<div className="simpleCard">el que lee es gay</div>
				</div>
			</div>
		</>
	);
};

export default MisReservas;
