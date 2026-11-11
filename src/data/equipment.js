import legoImage from '../../assets/CajaLego.png';
import gafasImage from '../../assets/gafas.png';
import impresoraImage from '../../assets/impresora.png';
import laserImage from '../../assets/Laser.png';
import pantallaImage from '../../assets/pantalla.png';

export const EQUIPMENT = [
  {
    id: 'EQ-01',
    name: 'Gafas de Realidad Virtual',
    type: 'Gafas',
    desc: 'Gafas de realidad virtual con pantalla de alta resolución y sensores de movimiento.',
    img: gafasImage,
    total: 5,
    spaceNumber: 502,
  },
  {
    id: 'EQ-02',
    name: 'Impresora 3D',
    type: 'impresora',
    desc: 'Impresora 3D de alto rendimiento con capacidad de impresión en 3D de alta calidad.',
    img: impresoraImage,
    total: 2,
    spaceNumber: 502,
  },
  {
    id: 'EQ-03',
    name: 'Cortadora láser',
    type: 'cortadora',
    desc: 'Máquina de corte láser con precisión y eficiencia para trabajos de diseño y prototipado.',
    img: laserImage,
    total: 2,
    spaceNumber: 502,
  },
  {
    id: 'EQ-04',
    name: 'Pantalla Inteligente',
    type: 'pantalla',
    desc: 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.',
                                                                                                                                                                                                                                                                   img: pantallaImage,
    total: 1,
    spaceNumber: 501,
  },
  {
    id: 'EQ-501-LEGO',
    name: 'Kit LEGO educativo',
    type: 'lego',
    desc: 'Kit de piezas LEGO para actividades educativas de construcción y robótica.',
    img: legoImage,
    total: 1,
    spaceNumber: 501,
  },
  {
    id: 'EQ-503-LEGO',
    name: 'Kit LEGO educativo',
    type: 'lego',
    desc: 'Kit de piezas LEGO para actividades educativas de construcción y robótica.',
    img: legoImage,
    total: 1,
    spaceNumber: 503,
  },
  {
    id: 'EQ-503-PANTALLA',
    name: 'Pantalla Inteligente',
    type: 'pantalla',
    desc: 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.',
    img: pantallaImage,
    total: 1,
    spaceNumber: 503,
  },
  {
    id: 'EQ-504-PANTALLA',
    name: 'Pantalla Inteligente',
    type: 'pantalla',
    desc: 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.',
    img: pantallaImage,
    total: 1,
    spaceNumber: 504,
  },
];
