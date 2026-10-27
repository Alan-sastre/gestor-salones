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
    total: 5
  },
  {
    id: 'EQ-02',
    name: 'Impresora 3D',
    type: 'impresora',
    desc: 'Impresora 3D de alto rendimiento con capacidad de impresión en 3D de alta calidad.',
    img: impresoraImage,
    total: 2
  },
  {
    id: 'EQ-03',
    name: 'Cortadora láser',
    type: 'cortadora',
    desc: 'Máquina de corte láser con precisión y eficiencia para trabajos de diseño y prototipado.',
    img: laserImage,
    total: 2
  },
  {
    id: 'EQ-04',
    name: 'Pantalla Inteligente',
    type: 'pantalla',
    desc: 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.',
    img: pantallaImage,
    total: 1
  },

];
