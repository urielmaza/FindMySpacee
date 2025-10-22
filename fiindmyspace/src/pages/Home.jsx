// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';
import logo from '../assets/logofindmyspace.png';

const Home = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [revealedFaqs, setRevealedFaqs] = useState(new Set());

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const copyPhoneNumber = () => {
    const phoneNumber = '+541161757162';
    navigator.clipboard.writeText(phoneNumber).then(() => {
      // Opcional: mostrar una notificación de éxito
      alert('Número copiado al portapapeles: ' + phoneNumber);
    }).catch(err => {
      console.error('Error al copiar el número: ', err);
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = phoneNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Número copiado al portapapeles: ' + phoneNumber);
    });
  };

  useEffect(() => {
    // Restaurar partículas animadas (estrellas) como antes
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const section = document.querySelector(`.${styles.background}`);
    if (!section) return; // Verifica si el elemento existe antes de continuar

    const createSquare = () => {
      const square = document.createElement('span');
      const size = Math.random() * 5; // tamaño máximo de las pelotitas

      square.style.width = 4 + size + 'px';
      square.style.height = 4 + size + 'px';
      square.style.top = Math.random() * window.innerHeight + 'px';
      square.style.left = Math.random() * window.innerWidth + 'px';
      square.style.position = 'absolute';
      square.style.borderRadius = '50%';
      square.style.background = 'white';
      square.style.pointerEvents = 'none';
      square.style.opacity = String(0.35 + Math.random() * 0.55);
      square.style.animation = `${styles.animate} 5s linear infinite`;

      section.appendChild(square);

      setTimeout(() => {
        square.remove();
      }, 5000);
    };

    const interval = setInterval(createSquare, 150);
    return () => clearInterval(interval);
  }, []);

  // Animación de entrada del primer bloque (#inicio)
  useEffect(() => {
    // Delay inicial para que el texto aparezca después de un pequeño tiempo de espera
    const t = setTimeout(() => setHeroVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Reveal al hacer scroll (sección "nosotros")
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallViewport = typeof window !== 'undefined' && window.innerWidth <= 480;

    // Accesibilidad o pantallas muy angostas: revelar sin esperar al scroll
    if (prefersReducedMotion || isSmallViewport) {
      elements.forEach(el => {
        el.classList.add(styles.revealVisible);
        // Si es un contenedor de cadena, mostrar inmediatamente sus hijos
        if (el.hasAttribute('data-chain')) {
          const chainChildren = el.querySelectorAll(`.${styles.faqItem}`);
          chainChildren.forEach(child => child.classList.add(styles.revealVisible));
        }
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const variant = target.getAttribute('data-reveal-variant');
            const isChain = target.hasAttribute('data-chain');

            // Función auxiliar para aplicar clase visible según variante
            const applyVisible = (el) => {
              if (variant === 'slow') {
                el.classList.add(styles.revealSlowVisible);
              } else {
                el.classList.add(styles.revealVisible);
              }
            };

            if (isChain) {
              // Revela en cadena los hijos directos tipo faqItem
              const items = target.querySelectorAll(`.${styles.faqItem}`);
              items.forEach((item, index) => {
                const delay = index * 180; // intervalo de cadena
                setTimeout(() => applyVisible(item), delay);
              });
              // Opcional: también marcar el contenedor como visible
              applyVisible(target);
            } else {
              applyVisible(target);
            }

            io.unobserve(target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Reveal por ítem en FAQs: cada item se revela al entrar en viewport y queda visible
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(document.querySelectorAll('[data-faq-item="true"]'));
    if (!items.length) return;

    if (prefersReducedMotion) {
      // Revelar todos inmediatamente si reduce motion
      setRevealedFaqs(new Set(items.map((el) => Number(el.getAttribute('data-faq-index')))));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-faq-index'));
            setRevealedFaqs((prev) => {
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div id='inicio' className={`${styles.background}`}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>
            <div className={styles.spinner1}></div>
          </div>
        </div>
        <div className={styles.textContainer}>
          <h1 className={`${styles.mainTitle} ${styles.leftIntro} ${heroVisible ? styles.leftVisible : ''}`}>Visualiza cualquier estacionamiento
          <br /> como si estuvieras allí</h1>
          <p className={`${styles.description} ${styles.rightIntro} ${heroVisible ? styles.rightVisible : ''}`}>Estacionamientos públicos y privados (busca, reserva y disfruta).</p>
          <button onClick={() => navigate('/login')} className={`${styles.bannerButton} ${styles.login} ${styles.leftIntro} ${heroVisible ? styles.leftVisibleButton : ''}`}>Empezá a buscar tu estacionamiento</button>
        </div>
      </div>
  <div id="nosotros" className={styles.us}>
        <div className={styles.container}>
          <h2 className={`${styles.mainTitle} ${styles.revealBase}`} data-reveal>¿QUÉ ES <span className={styles.highlight}>FINDMYSPACE</span>?</h2>
          <p className={`${styles.description} ${styles.revealBase}`} data-reveal>
            FindMySpace es la plataforma de estacionamiento que utiliza inteligencia artificial para 
            convertir cualquier estacionamiento en una experiencia interactiva, mejorando la forma en que buscamos y reservamos espacios.
          </p>
          
          <div className={`${styles.featuresGrid} ${styles.revealParent}`}>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <span>IA entrenada</span>
            </div>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
                  <polyline points="7.5,19.79 7.5,14.6 3,12"/>
                  <polyline points="21,12 16.5,14.6 16.5,19.79"/>
                </svg>
              </div>
              <span>Compatible con cualquier estacionamiento</span>
            </div>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <span>Precisión en la búsqueda</span>
            </div>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <span>Contenido interactivo</span>
            </div>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <span>Sin conocimiento previos</span>
            </div>
            <div className={`${styles.featureItem} ${styles.revealBase}`} data-reveal>
              <div className={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                </svg>
              </div>
              <span>Fácil</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.functions}>
        <div className={styles.container}>
          <h2 className={`${styles.functionsTitle} ${styles.revealLeftBase}`} data-reveal data-reveal-variant="slow">CÓMO FUNCIONA EN 3 PASOS</h2>
          <p className={`${styles.functionsSubtitle} ${styles.revealRightBase}`} data-reveal data-reveal-variant="slow">Tan simple que vas a estar buscando tu estacionamiento en minutos</p>

          <div className={`${styles.stepsGrid} ${styles.revealParentSteps}`}>
            <div className={`${styles.stepCard} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Crea tu usuario / regístrate</h3>
              <p className={styles.stepDescription}>Se parte de nuestra comunidad para poder acceder a nuestras funcionalidades.</p>
            </div>
            
            <div className={`${styles.stepCard} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Carga tu estacionamiento o busca uno</h3>
              <p className={styles.stepDescription}>Propietarios: Sube la información de tu estacionamiento. <br />Conductores: Busca y reserva estacionamientos.</p>
            </div>
            
            <div className={`${styles.stepCard} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Ve resultados en tiempo real</h3>
              <p className={styles.stepDescription}>Recibe notificaciones instantáneas sobre reservas y disponibilidad.</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.benefits}>
        <div className={styles.container}>
          <h2 className={`${styles.benefitsTitle} ${styles.revealLeftBase}`} data-reveal data-reveal-variant="slow">BENEFICIOS PARA CADA PERFIL</h2>
          <p className={`${styles.benefitsSubtitle} ${styles.revealRightBase}`} data-reveal data-reveal-variant="slow">Diseñado específicamente para las necesidades de propietarios y conductores</p>
          
          <div className={`${styles.benefitsGrid} ${styles.revealParentBenefits}`}>
            <div className={`${styles.benefitCard} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.benefitIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className={styles.benefitSubtitle}>Para Propietarios</h3>
              <ul className={styles.benefitList}>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Genera ingresos rápidos y efectivos</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Seguridad garantizada</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Seguimiento de espacios automático</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Ve el vehiculo de cada conductor en tiempo real</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Mas tiempo de calidad</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Menos preparación, más interacción con tus conductores</span>
                </li>
              </ul>
              <button type="button" onClick={() => navigate('/register')} className={styles.benefitButton}>Empezar como propietario</button>
            </div>
            
            <div className={`${styles.benefitCard} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.benefitIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className={styles.benefitSubtitle}>Para Conductores</h3>
              <ul className={styles.benefitList}>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Encuentra estacionamientos fácilmente</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Seguridad garantizada</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Disfruta de un viaje más relajado y sin preocupaciones</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Convierte el viaje en una experiencia que no vas a olvidar</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Reserva o visualiza estacionamientos desde cualquier lugar</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Adios a las pérdidas de tiempo dando infinitud de vueltas</span>
                </li>
              </ul>
              <button type="button" onClick={() => navigate('/register')} className={styles.benefitButton}>Empezar como conductor</button>
            </div>
          </div>
        </div>
      </div>               
  <div id="preguntas" className={styles.faqs}>
        <div className={styles.container}>
          <h2 className={`${styles.faqsTitle} ${styles.revealLeftBase}`} data-reveal data-reveal-variant="slow">Preguntas frecuentes</h2>
          <p className={`${styles.faqsSubtitle} ${styles.revealRightBase}`} data-reveal data-reveal-variant="slow">Todo lo que necesitás saber para empezar a encontrar tu estacionamiento perfecto con FindMySpace.</p>
          
          <div className={`${styles.faqsContainer} ${styles.revealParentFaqs}`} data-reveal data-reveal-variant="slow">
            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(0) ? styles.revealSlowVisible : ''} ${activeFaq === 0 ? styles.active : ''}`} data-faq-item="true" data-faq-index="0">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(0)}>
                <span>¿Hay versión gratuita?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Sí, FindMySpace ofrece una versión gratuita que te permite buscar y reservar estacionamientos básicos. Para funciones premium como reservas prioritarias y notificaciones en tiempo real, ofrecemos planes pagos muy accesibles.</p>
              </div>
            </div>

            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(1) ? styles.revealSlowVisible : ''} ${activeFaq === 1 ? styles.active : ''}`} data-faq-item="true" data-faq-index="1">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(1)}>
                <span>¿Es seguro dejar mi vehículo?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Absolutamente. Todos los estacionamientos en nuestra plataforma son verificados y cuentan con medidas de seguridad. Además, ofrecemos seguro opcional para mayor tranquilidad y soporte 24/7 ante cualquier inconveniente.</p>
              </div>
            </div>

            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(2) ? styles.revealSlowVisible : ''} ${activeFaq === 2 ? styles.active : ''}`} data-faq-item="true" data-faq-index="2">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(2)}>
                <span>¿Qué métodos de pago aceptan?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Aceptamos tarjetas de crédito y débito (Visa, Mastercard), transferencias bancarias, billeteras virtuales. Todos los pagos son procesados de forma segura con encriptación de extremo a extremo.</p>
              </div>
            </div>

            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(3) ? styles.revealSlowVisible : ''} ${activeFaq === 3 ? styles.active : ''}`} data-faq-item="true" data-faq-index="3">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(3)}>
                <span>¿Puedo cancelar mi reserva?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Sí, puedes cancelar tu reserva hasta 30 minutos antes del horario reservado sin costo adicional. Para cancelaciones con menos tiempo, se aplicará una tarifa mínima que depende del tipo de estacionamiento.</p>
              </div>
            </div>

            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(4) ? styles.revealSlowVisible : ''} ${activeFaq === 4 ? styles.active : ''}`} data-faq-item="true" data-faq-index="4">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(4)}>
                <span>¿Cómo publico mi estacionamiento?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Es muy simple: regístrate como propietario, completa la información de tu estacionamiento (ubicación, fotos, precio), pasa nuestra verificación básica y ¡listo! Empezarás a recibir reservas en 24-48 horas.</p>
              </div>
            </div>

            <div className={`${styles.faqItem} ${styles.revealUpBase} ${revealedFaqs.has(5) ? styles.revealSlowVisible : ''} ${activeFaq === 5 ? styles.active : ''}`} data-faq-item="true" data-faq-index="5">
              <div className={styles.faqQuestion} onClick={() => toggleFaq(5)}>
                <span>¿Qué soporte técnico ofrecen?</span>
                <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              <div className={styles.faqAnswer}>
                <p>Ofrecemos soporte 24/7 a través de chat en vivo, WhatsApp y email. También tenemos una sección de ayuda completa con tutoriales paso a paso y un centro de llamadas para emergencias.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="contacto" className={styles.Footer}>
        <div className={styles.footerContainer}>
          <div className={`${styles.footerTop} ${styles.revealParentFooter}`}>
            <div className={`${styles.footerSection} ${styles.revealLeftBase}`} data-reveal data-reveal-variant="slow">
              <div className={styles.logoSection}>
                <img src={logo} alt="FindMySpace" className={styles.footerLogo} />
                <p className={styles.footerDescription}>
                  La plataforma líder en estacionamientos inteligentes. Encuentra, reserva y disfruta de la mejor experiencia de estacionamiento.
                </p>
              </div>
            </div>
            
            <div className={`${styles.footerSection} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <h3 className={styles.footerSectionTitle}>Navegación</h3>
              <ul className={styles.footerLinks}>
                <li><button onClick={() => scrollToSection('nosotros')} className={styles.footerLink}>¿Qué es FindMySpace?</button></li>
                <li><button onClick={() => scrollToSection('preguntas')} className={styles.footerLink}>Preguntas frecuentes</button></li>
              </ul>
            </div>
            <div className={`${styles.footerSection} ${styles.revealUpBase}`} data-reveal data-reveal-variant="slow">
              <h3 className={styles.footerSectionTitle}>Contacto</h3>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Buenos Aires, Argentina</span>
                </div>
                <div className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href="mailto:findmyspace025@gmail.com" className={styles.footerLink}>findmyspace025@gmail.com</a>
                </div>
                <div className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <button onClick={copyPhoneNumber} className={styles.footerLink} title="Haz clic para copiar el número">+54 11 6175-7162</button>
                </div>
                <div className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>Lun - Vie: 9:00 - 18:00</span>
                </div>
              </div>
            </div>
            <div className={`${styles.footerSection} ${styles.revealRightBase}`} data-reveal data-reveal-variant="slow">
              <h3 className={styles.footerSectionTitle}>Redes Sociales</h3>
              <ul className={styles.footerLinks}>
                <div className={styles.socialLinks}>
                  <a href="https://www.instagram.com/findmyspaceoficial" className={styles.socialLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="" className={styles.socialLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.27 20.1H3.65V9.24h3.62V20.1zM5.47 7.76h-.03c-1.22 0-2-.83-2-1.87C3.44 4.78 4.69 4 5.94 4c1.26 0 2.03.78 2.06 1.89C8 6.93 7.17 7.76 5.47 7.76zM20.34 20.1h-3.63v-5.8c0-1.45-.52-2.45-1.83-2.45-1 0-1.6.67-1.87 1.32-.1.23-.11.55-.11.88v6.05H9.28s.05-9.82 0-10.84h3.63v1.54a3.6 3.6 0 0 1 3.26-1.8c2.39 0 4.18 1.56 4.18 4.89v6.21z"/>
                    </svg>
                  </a>
                  <a href="#" className={styles.socialLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                </div>
              </ul>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <div className={`${styles.footerBottomLeft} ${styles.revealLeftBase}`} data-reveal data-reveal-variant="slow">
              <p>&copy; 2025 FindMySpace. Todos los derechos reservados.</p>
            </div>
            <div className={`${styles.footerBottomRight} ${styles.revealRightBase}`} data-reveal data-reveal-variant="slow">
              <a href="/privacidad" className={styles.footerLegalLink}>Política de privacidad</a>
              <span className={styles.separator}>|</span>
              <a href="/terminos" className={styles.footerLegalLink}>Términos de servicio</a>
              <span className={styles.separator}>|</span>
              <a href="/cookies" className={styles.footerLegalLink}>Política de cookies</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
