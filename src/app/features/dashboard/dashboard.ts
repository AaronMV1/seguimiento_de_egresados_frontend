import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { Http } from '../../core/services/http';
import { Alertas } from '../../shared/utils/alertas';
import Swal from 'sweetalert2';



// Función: Define la estructura de datos de cada egresado.
interface Egresado {
	nombre: string;
	apellidoPaterno: string;
	apellidoMaterno: string;
	anioEgreso: string;
	carrera: string;
	correoIInstitucional: string;
    facultad: string;
    sedeFilial: string;
}


// Función: Define la estructura de datos de cada egresado.
interface EgresadoBK {
	tipoDocumento: string;
    numeroDocumento: string;
    nombresApellidos: string;
    genero: string;
    sede: string;
    facultad: string;
    carrera: string;
	anioEgreso: number;
	correoElectronico: string;
    numeroCelular: string;
    fase1Participacion: string;
    fase1Situacion: string;
    fase1Trabajando: string;
    fase1Primerempleo: string;
    fase1Medios: string;
    fase2Satisfaccionestudios: string;
    fase2Participacion: string;
    fase2Satisfaccionservicio: string;
    fase2Planificacion: string;
    fase2Empresanombre: string;
    fase2Empresaempleadornombre: string;
    fase2Empresaempleadorcorreo: string;
    fase2Empresaempleadornumero: string;
    fase3Especialidad: string;
    fase3Participacion: string;
    fase3Educacioncontinua: string;
    fase4Investigacion: string;
    fase4Participacion: string;
    fase4Resultados: string;
    fase4Innovacion: string;
    fase4Capacitacion: string;
    fase4Formacion: string;
}


// Función: Define la plantilla base para construir cada fase del dashboard.
interface PlantillaFase {
	id: string;
	titulo: string;
	aniosMinimosDesdeEgreso: number;
	aniosMaximosDesdeEgreso: number | null;
	etiquetaCohorte: string;
	descripcion: string;
	imagen: string;
}


// Función: Define la estructura final de cada fase ya procesada con sus años y egresados.
interface FaseDashboard {
	id: string;
	titulo: string;
	etiquetaCohorte: string;
	anios: number[];
	egresados: EgresadoBK[];
	descripcion: string;
	imagen: string;
}


@Component({
	selector: 'app-dashboard',
	imports: [CommonModule, FormsModule],
	templateUrl: './dashboard.html',
	styleUrl: './dashboard.css',
})


export class Dashboard implements OnInit {


	egresadoBK: EgresadoBK[] = [];


    ngOnInit(): void {
        this.obtenerEncuestados();
    }


    constructor( private _http: Http, private readonly cdr: ChangeDetectorRef ) { }


	// Función: Define el año actual usado para calcular dinámicamente las cohortes.
	readonly anioActual = new Date().getFullYear();
	// readonly anioActual = 2030;


	// Función: Contiene la configuración base de las fases del dashboard.
	readonly plantillasFases: PlantillaFase[] = [
		{ id: 'fase_1', titulo: 'Fase 1: Información', aniosMinimosDesdeEgreso: 0, aniosMaximosDesdeEgreso: 3, etiquetaCohorte: '0 - 3 años', descripcion: 'Corresponde a los egresados que inician su vida profesional. En esta etapa se realiza el seguimiento de su inserción laboral, la actualización de sus datos y el fortalecimiento de su empleabilidad mediante oportunidades de trabajo, capacitación inicial y acompañamiento profesional.', imagen: 'assets/images/fases/Fase%201.png', },
		{ id: 'fase_2', titulo: 'Fase 2: Formación', aniosMinimosDesdeEgreso: 4, aniosMaximosDesdeEgreso: 5, etiquetaCohorte: '4 - 5 años', descripcion: 'Comprende a los egresados que han consolidado experiencia laboral. Se recopila información sobre su desempeño, logros y formación continua, además de obtener retroalimentación para contribuir a la mejora del plan curricular y de la calidad académica.', imagen: 'assets/images/fases/Fase%202.png', },
		{ id: 'fase_3', titulo: 'Fase 3: Autocapacitación', aniosMinimosDesdeEgreso: 6, aniosMaximosDesdeEgreso: 7, etiquetaCohorte: '6 - 7 años', descripcion: 'En esta etapa se evalúa el crecimiento académico y profesional del egresado, identificando estudios de posgrado, especializaciones, certificaciones y otros procesos de actualización que fortalecen su perfil profesional.', imagen: 'assets/images/fases/Fase%203.png', },
		{ id: 'fase_4', titulo: 'Fase 4: Innovación', aniosMinimosDesdeEgreso: 8, aniosMaximosDesdeEgreso: null, etiquetaCohorte: '8 - X años', descripcion: 'Corresponde a los egresados con una trayectoria profesional consolidada. Se identifican sus aportes en investigación, innovación, emprendimiento, liderazgo y generación de conocimiento, evidenciando su impacto en la sociedad y en el desarrollo de su profesión.', imagen: 'assets/images/fases/Fase%204.png', },
	];


	// Función: Construye las fases finales con sus años y egresados correspondientes.
	fases: FaseDashboard[] = [];


	// Función: Guarda el ID de la fase seleccionada actualmente.
	idFaseSeleccionada = '';


	// Función: Guarda el valor actual de los controles de filtro antes de aplicarlos.
	textoBusqueda = '';
	seleccionCarrera = '';
	seleccionFacultad = '';
	seleccionSede = '';
	seleccionAnio = '';


	// Función: Guarda los filtros activos que se aplican a la tabla.
	filtroTexto = '';
	filtroCarrera = '';
	filtroFacultad = '';
	filtroSede = '';
	filtroAnio = '';

	// Función: Configura la paginación para la tabla de egresados.
	paginaActual = 1;
	registrosPorPagina = 10;
	readonly opcionesRegistrosPorPagina: number[] = [10, 20, 50, 100, 200];


	// Función: Guarda la columna y la dirección de orden alfabético aplicados a la tabla y al Excel.
	columnaOrden: 'nombresApellidos' | 'anioEgreso' | 'correoElectronico' | 'sede' | 'facultad' | 'carrera' | null = null;
	direccionOrden: 'asc' | 'desc' = 'asc';


	// Función: Devuelve la cantidad total de egresados registrados.
	get cantidadEgresados(): number {
		return this.egresadoBK.length;
	}


	// Función: Devuelve la fase seleccionada actualmente.
	get faseSeleccionada(): FaseDashboard | undefined {
		return this.fases.find((fase) => fase.id === this.idFaseSeleccionada);
	}


	// Función: Devuelve los egresados pertenecientes a la fase seleccionada.
	get egresadosFaseSeleccionada(): EgresadoBK[] {
		return this.faseSeleccionada?.egresados ?? [];
	}


	// Función: Devuelve los egresados que se mostrarán en la tabla.
	get egresadosVisibles(): EgresadoBK[] {
		return this.aplicarOrden(this.aplicarCriterios(this.egresadosBaseVisibles));
	}


	// Función: Devuelve los egresados visibles de la página actual.
	get egresadosPaginados(): EgresadoBK[] {

        this.ajustarPaginaActual();

        const cantidadPorPagina = Number(this.registrosPorPagina);

        const indiceInicio =
            (this.paginaActual - 1) * cantidadPorPagina;

        const indiceFin =
            indiceInicio + cantidadPorPagina;

        return this.egresadosVisibles.slice(
            indiceInicio,
            indiceFin,
        );

    }


	// Función: Calcula la cantidad total de páginas disponibles.
	get totalPaginas(): number {

		return Math.max(1, Math.ceil(this.egresadosVisibles.length / this.registrosPorPagina));

	}


	// Función: Devuelve un arreglo con los números de páginas para el paginador.
	get paginasDisponibles(): number[] {

		const total = this.totalPaginas;
		const radio = 3;
		const maximoBotones = radio * 2 + 1;

		let paginaInicio = Math.max(1, this.paginaActual - radio);
		let paginaFin = Math.min(total, this.paginaActual + radio);

		const botonesActuales = paginaFin - paginaInicio + 1;
		const botonesFaltantes = maximoBotones - botonesActuales;

		if (botonesFaltantes > 0) {

			if (paginaInicio === 1) {
				paginaFin = Math.min(total, paginaFin + botonesFaltantes);
			} else if (paginaFin === total) {
				paginaInicio = Math.max(1, paginaInicio - botonesFaltantes);
			}

		}

		return Array.from(
			{ length: paginaFin - paginaInicio + 1 },
			(_, i) => paginaInicio + i,
		);

	}


	// Función: Devuelve la posición inicial del rango mostrado en la tabla.
	get indiceInicioPaginacion(): number {

		if (this.egresadosVisibles.length === 0) {
			return 0;
		}

		return (this.paginaActual - 1) * this.registrosPorPagina + 1;

	}


	// Función: Devuelve la posición final del rango mostrado en la tabla.
	get indiceFinPaginacion(): number {

		return Math.min(this.paginaActual * this.registrosPorPagina, this.egresadosVisibles.length);

	}


	// Función: Devuelve los egresados base según la fase seleccionada.
	get egresadosBaseVisibles(): EgresadoBK[] {

		if (this.egresadosFaseSeleccionada.length > 0) {
			return this.egresadosFaseSeleccionada;
		}
		return [...this.egresadoBK].sort((a, b) => Number(b.anioEgreso) - Number(a.anioEgreso));

	}


	// Función: Devuelve las opciones dinámicas de carrera según la facultad seleccionada (vacío si no hay facultad elegida).
	get opcionesCarrera(): string[] {
		if (!this.seleccionFacultad) {
			return [];
		}

		const egresadosDeLaFacultad = this.egresadosBaseVisibles.filter(
			(egresado) => egresado.facultad === this.seleccionFacultad,
		);

		return this.obtenerOpcionesUnicas(egresadosDeLaFacultad.map((egresado) => egresado.carrera));
	}


	// Función: Devuelve las opciones dinámicas de facultad según los registros visibles.
	get opcionesFacultad(): string[] {
		return this.obtenerOpcionesUnicas(this.egresadosBaseVisibles.map((egresado) => egresado.facultad));
	}


	// Función: Devuelve las opciones dinámicas de sede según los registros visibles.
	get opcionesSede(): string[] {
		return this.obtenerOpcionesUnicas(this.egresadosBaseVisibles.map((egresado) => egresado.sede));
	}


	// Función: Devuelve las opciones dinámicas de año según los registros visibles.
	get opcionesAnio(): string[] {
		return this.obtenerOpcionesUnicas(this.egresadosBaseVisibles.map((egresado) => String(egresado.anioEgreso)))
			.sort((a, b) => Number(b) - Number(a));
	}


	// Función: Indica si se están mostrando todos los egresados porque la fase seleccionada no tiene registros.
	get mostrarTodosEgresadosComoRespaldo(): boolean {
		return this.egresadosFaseSeleccionada.length === 0 && this.egresadoBK.length > 0;
	}


	// Función: Obtiene la cantidad máxima de egresados entre fases para calcular el ancho de las barras.
	get cantidadMaximaGraficoFases(): number {
		const maximo = Math.max(...this.fases.map((fase) => fase.egresados.length), 0);
		return maximo > 0 ? maximo : 1;
	}


	// Función: Obtiene la cantidad máxima de egresados por año dentro de la fase seleccionada.
	get cantidadMaximaGraficoAnios(): number {
		const maximo = Math.max(...this.filasAniosFaseSeleccionada.map((fila) => fila.cantidad), 0);
		return maximo > 0 ? maximo : 1;
	}


	// Función: Genera las filas del gráfico de egresados por año de la fase seleccionada.
	get filasAniosFaseSeleccionada(): { anio: number; cantidad: number }[] {
		if (!this.faseSeleccionada) {
			return [];
		}

		return this.faseSeleccionada.anios.map((anio) => ({
			anio,
			cantidad: this.egresadosFaseSeleccionada.filter((egresado) => Number(egresado.anioEgreso) === anio).length,
		}));
	}


	// Función: Cambia la fase seleccionada al hacer clic en la línea de tiempo.
	seleccionarFase(idFase: string): void {
		this.idFaseSeleccionada = idFase;
		this.paginaActual = 1;
	}


	// Función: Ordena la tabla por la columna elegida, alternando entre ascendente y descendente si se repite el clic.
	ordenarPorColumna(columna: 'nombresApellidos' | 'anioEgreso' | 'correoElectronico' | 'sede' | 'facultad' | 'carrera'): void {

		if (this.columnaOrden === columna) {
			this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
		} else {
			this.columnaOrden = columna;
			this.direccionOrden = 'asc';
		}

		this.paginaActual = 1;

	}


	// Función: Aplica el filtro de texto en tiempo real sobre los seis campos de la tabla.
	aplicarFiltroTexto(): void {
		this.filtroTexto = this.textoBusqueda.trim();
		this.paginaActual = 1;
	}


	// Función: Limpia la carrera elegida al cambiar de facultad, ya que sus opciones dependen de ella.
	cambiarFacultadSeleccionada(): void {
		this.seleccionCarrera = '';
	}


	// Función: Aplica los filtros seleccionados desde los controles de la interfaz.
	aplicarFiltros(): void {
		this.aplicarFiltroTexto();
		this.filtroCarrera = this.seleccionCarrera;
		this.filtroFacultad = this.seleccionFacultad;
		this.filtroSede = this.seleccionSede;
		this.filtroAnio = this.seleccionAnio;
		this.paginaActual = 1;
	}


	// Función: Reinicia los controles y filtros activos para mostrar nuevamente todos los registros.
	reiniciarFiltros(): void {
		this.textoBusqueda = '';
		this.seleccionCarrera = '';
		this.seleccionFacultad = '';
		this.seleccionSede = '';
		this.seleccionAnio = '';

		this.filtroTexto = '';
		this.filtroCarrera = '';
		this.filtroFacultad = '';
		this.filtroSede = '';
		this.filtroAnio = '';

		this.paginaActual = 1;
	}


	// Función: Cambia el tamaño de página y reinicia a la primera página.
	cambiarRegistrosPorPagina(): void {

        this.registrosPorPagina = Number(
            this.registrosPorPagina,
        );

        this.paginaActual = 1;

    }


	// Función: Navega a una página específica del paginador.
	irAPagina(pagina: number): void {

		if (pagina < 1 || pagina > this.totalPaginas) {
			return;
		}

		this.paginaActual = pagina;

	}


	// Función: Navega a la página anterior si existe.
	irAPaginaAnterior(): void {

		this.irAPagina(this.paginaActual - 1);

	}


	// Función: Navega a la página siguiente si existe.
	irAPaginaSiguiente(): void {

		this.irAPagina(this.paginaActual + 1);

	}


	// Función: Navega directamente a la primera página.
	irAPrimeraPagina(): void {

		this.irAPagina(1);

	}


	// Función: Navega directamente a la última página.
	irAUltimaPagina(): void {

		this.irAPagina(this.totalPaginas);

	}


	// Función: Descarga en Excel los registros visibles de la tabla con sus columnas.
	private agruparRegistros(
        registros: EgresadoBK[],
        obtenerValor: (egresado: EgresadoBK) => string,
    ): { etiqueta: string; cantidad: number }[] {

        const agrupacion = new Map<string, number>();

        registros.forEach((egresado) => {

            const valor = obtenerValor(egresado)?.trim() || 'Sin especificar';

            agrupacion.set(
                valor,
                (agrupacion.get(valor) ?? 0) + 1,
            );

        });

        return Array.from(agrupacion.entries())
            .map(([etiqueta, cantidad]) => ({
                etiqueta,
                cantidad,
            }))
            .sort((a, b) => b.cantidad - a.cantidad);

    }

    private agruparPorAnio(
        registros: EgresadoBK[],
    ): { etiqueta: string; cantidad: number }[] {

        return this.agruparRegistros(
            registros,
            (egresado) => String(egresado.anioEgreso),
        )
        .sort(
            (a, b) => Number(b.etiqueta) - Number(a.etiqueta),
        );

    }

    private crearHojaResumen(
        XLSX: any,
        registros: EgresadoBK[],
    ): any {

        const porAnio = this.agruparPorAnio(registros);

        const porSede = this.agruparRegistros(
            registros,
            (egresado) => egresado.sede,
        );

        const porFacultad = this.agruparRegistros(
            registros,
            (egresado) => egresado.facultad,
        );

        const porCarrera = this.agruparRegistros(
            registros,
            (egresado) => egresado.carrera,
        );

        const filasResumen: unknown[][] = [
            ['RESUMEN DE EGRESADOS'],
            [],
            ['Total de egresados', registros.length],
            [],
            ['EGRESADOS POR AÑO DE EGRESO'],
            ['Año de egreso', 'Cantidad'],
            ...porAnio.map((item) => [
                Number(item.etiqueta),
                item.cantidad,
            ]),
            [],
            ['EGRESADOS POR SEDE'],
            ['Sede', 'Cantidad'],
            ...porSede.map((item) => [
                item.etiqueta,
                item.cantidad,
            ]),
            [],
            ['EGRESADOS POR FACULTAD'],
            ['Facultad', 'Cantidad'],
            ...porFacultad.map((item) => [
                item.etiqueta,
                item.cantidad,
            ]),
            [],
            ['EGRESADOS POR PROGRAMA'],
            ['Programa', 'Cantidad'],
            ...porCarrera.map((item) => [
                item.etiqueta,
                item.cantidad,
            ]),
        ];

        const worksheetResumen =
            XLSX.utils.aoa_to_sheet(filasResumen);

        worksheetResumen['!cols'] = [
            { wch: 60 },
            { wch: 18 },
        ];

        // Título principal.
        worksheetResumen['A1'].s = {
            fill: {
                patternType: 'solid',
                fgColor: {
                    rgb: 'FF0A41',
                },
            },
            font: {
                bold: true,
                color: {
                    rgb: 'FFFFFF',
                },
                sz: 16,
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
            },
        };

        worksheetResumen['!merges'] = [
            {
                s: { r: 0, c: 0 },
                e: { r: 0, c: 1 },
            },
        ];

        worksheetResumen['!rows'] = [
            { hpt: 30 },
        ];

        // Colorear títulos y cabeceras de cada sección.
        Object.keys(worksheetResumen).forEach((direccion) => {

            if (direccion.startsWith('!')) {
                return;
            }

            const celda = worksheetResumen[direccion];

            if (!celda || typeof celda.v !== 'string') {
                return;
            }

            const valor = celda.v;

            const esTituloSeccion =
                valor.startsWith('EGRESADOS POR');

            const esCabecera =
                valor === 'Año de egreso' ||
                valor === 'Sede' ||
                valor === 'Facultad' ||
                valor === 'Programa' ||
                valor === 'Cantidad';

            if (esTituloSeccion) {

                celda.s = {
                    fill: {
                        patternType: 'solid',
                        fgColor: {
                            rgb: 'D9E2F3',
                        },
                    },
                    font: {
                        bold: true,
                        color: {
                            rgb: '1F1F1F',
                        },
                    },
                    alignment: {
                        vertical: 'center',
                    },
                };

            }

            if (esCabecera) {

                celda.s = {
                    fill: {
                        patternType: 'solid',
                        fgColor: {
                            rgb: 'FF0A41',
                        },
                    },
                    font: {
                        bold: true,
                        color: {
                            rgb: 'FFFFFF',
                        },
                    },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center',
                    },
                    border: {
                        top: {
                            style: 'thin',
                            color: { rgb: 'D9E2F3' },
                        },
                        bottom: {
                            style: 'thin',
                            color: { rgb: 'D9E2F3' },
                        },
                        left: {
                            style: 'thin',
                            color: { rgb: 'D9E2F3' },
                        },
                        right: {
                            style: 'thin',
                            color: { rgb: 'D9E2F3' },
                        },
                    },
                };

            }

        });

        return worksheetResumen;

    }

    // Función: Construye una tabla cruzada (Programa x Sede) con el total de egresados en cada combinación.
    private crearHojaProgramaSede(
        XLSX: any,
        registros: EgresadoBK[],
    ): any {

        const normalizar = (valor: string | undefined | null) =>
            valor?.trim() || 'Sin especificar';

        const sedes = Array.from(
            new Set(registros.map((egresado) => normalizar(egresado.sede))),
        ).sort((a, b) => a.localeCompare(b));

        const conteoPorCarreraYSede = new Map<string, Map<string, number>>();

        registros.forEach((egresado) => {

            const carrera = normalizar(egresado.carrera);
            const sede = normalizar(egresado.sede);

            if (!conteoPorCarreraYSede.has(carrera)) {
                conteoPorCarreraYSede.set(carrera, new Map());
            }

            const filaCarrera = conteoPorCarreraYSede.get(carrera)!;
            filaCarrera.set(sede, (filaCarrera.get(sede) ?? 0) + 1);

        });

        const carrerasConTotal = Array.from(conteoPorCarreraYSede.entries())
            .map(([carrera, filaCarrera]) => ({
                carrera,
                filaCarrera,
                total: sedes.reduce((acc, sede) => acc + (filaCarrera.get(sede) ?? 0), 0),
            }))
            .sort((a, b) => b.total - a.total);

        const totalesPorSede = sedes.map((sede) =>
            registros.filter((egresado) => normalizar(egresado.sede) === sede).length,
        );

        const encabezado = ['Programa', ...sedes, 'Total'];

        const filas = carrerasConTotal.map(({ carrera, filaCarrera, total }) => [
            carrera,
            ...sedes.map((sede) => filaCarrera.get(sede) ?? 0),
            total,
        ]);

        const filaTotal = ['TOTAL', ...totalesPorSede, registros.length];

        const numColumnas = encabezado.length;
        const filaEncabezadoIndex = 2;
        const filaTotalIndex = filaEncabezadoIndex + filas.length + 1;

        const datos: unknown[][] = [
            ['EGRESADOS POR PROGRAMA Y SEDE'],
            [],
            encabezado,
            ...filas,
            filaTotal,
        ];

        const worksheetProgramaSede = XLSX.utils.aoa_to_sheet(datos);

        worksheetProgramaSede['!cols'] = [
            { wch: 55 },
            ...sedes.map(() => ({ wch: 16 })),
            { wch: 12 },
        ];

        worksheetProgramaSede['!merges'] = [
            {
                s: { r: 0, c: 0 },
                e: { r: 0, c: numColumnas - 1 },
            },
        ];

        worksheetProgramaSede['!rows'] = [
            { hpt: 30 },
        ];

        const estiloTitulo = {
            fill: {
                patternType: 'solid',
                fgColor: { rgb: 'FF0A41' },
            },
            font: {
                bold: true,
                color: { rgb: 'FFFFFF' },
                sz: 16,
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
            },
        };

        const estiloCabecera = {
            fill: {
                patternType: 'solid',
                fgColor: { rgb: 'FF0A41' },
            },
            font: {
                bold: true,
                color: { rgb: 'FFFFFF' },
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
                wrapText: true,
            },
            border: {
                top: { style: 'thin', color: { rgb: 'D9E2F3' } },
                bottom: { style: 'thin', color: { rgb: 'D9E2F3' } },
                left: { style: 'thin', color: { rgb: 'D9E2F3' } },
                right: { style: 'thin', color: { rgb: 'D9E2F3' } },
            },
        };

        const estiloTotal = {
            fill: {
                patternType: 'solid',
                fgColor: { rgb: 'D9E2F3' },
            },
            font: {
                bold: true,
                color: { rgb: '1F1F1F' },
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
            },
        };

        worksheetProgramaSede['A1'].s = estiloTitulo;

        for (let columna = 0; columna < numColumnas; columna++) {

            const celdaCabecera = worksheetProgramaSede[
                XLSX.utils.encode_cell({ r: filaEncabezadoIndex, c: columna })
            ];

            if (celdaCabecera) {
                celdaCabecera.s = estiloCabecera;
            }

            const celdaTotal = worksheetProgramaSede[
                XLSX.utils.encode_cell({ r: filaTotalIndex, c: columna })
            ];

            if (celdaTotal) {

                celdaTotal.s = {
                    ...estiloTotal,
                    alignment: {
                        ...estiloTotal.alignment,
                        horizontal: columna === 0 ? 'left' : 'center',
                    },
                };

            }

        }

        return worksheetProgramaSede;

    }

    private obtenerEncabezadosRespuestas(): string[] {
        return [
            'Fase 1 - Participación',
            'Fase 1 - Situación',
            'Fase 1 - Trabajando',
            'Fase 1 - Primer empleo',
            'Fase 1 - Medios',
            'Fase 2 - Satisfacción con estudios',
            'Fase 2 - Participación',
            'Fase 2 - Satisfacción con servicio',
            'Fase 2 - Planificación',
            'Fase 2 - Empresa',
            'Fase 2 - Nombre del empleador',
            'Fase 2 - Correo del empleador',
            'Fase 2 - Número del empleador',
            'Fase 3 - Especialidad',
            'Fase 3 - Participación',
            'Fase 3 - Educación continua',
            'Fase 4 - Investigación',
            'Fase 4 - Participación',
            'Fase 4 - Resultados',
            'Fase 4 - Innovación',
            'Fase 4 - Capacitación',
            'Fase 4 - Formación',
        ];
    }

    private obtenerFilaRespuestas(egresado: EgresadoBK): string[] {
        return [
            egresado.fase1Participacion,
            egresado.fase1Situacion,
            egresado.fase1Trabajando,
            egresado.fase1Primerempleo,
            egresado.fase1Medios,
            egresado.fase2Satisfaccionestudios,
            egresado.fase2Participacion,
            egresado.fase2Satisfaccionservicio,
            egresado.fase2Planificacion,
            egresado.fase2Empresanombre,
            egresado.fase2Empresaempleadornombre,
            egresado.fase2Empresaempleadorcorreo,
            egresado.fase2Empresaempleadornumero,
            egresado.fase3Especialidad,
            egresado.fase3Participacion,
            egresado.fase3Educacioncontinua,
            egresado.fase4Investigacion,
            egresado.fase4Participacion,
            egresado.fase4Resultados,
            egresado.fase4Innovacion,
            egresado.fase4Capacitacion,
            egresado.fase4Formacion,
        ];
    }

    async exportarRegistrosExcel(): Promise<void> {

		const XLSXModule: any = await import('xlsx-js-style');
		const XLSX: any = XLSXModule.utils ? XLSXModule : XLSXModule.default;

        if (this.egresadosVisibles.length === 0) {
            console.warn('No hay registros visibles para exportar.');
            return;
        }

        const encabezados = [
            'Nombres Completos',
            'Año de Egreso',
            'Correo Electrónico',
            'Número de Celular',
            'Sede',
            'Facultad',
            'Programa',
            ...this.obtenerEncabezadosRespuestas(),
        ];

        const filas = this.egresadosVisibles.map((egresado) => [
            egresado.nombresApellidos,
            egresado.anioEgreso,
            egresado.correoElectronico,
            egresado.numeroCelular,
            egresado.sede,
            egresado.facultad,
            egresado.carrera,
            ...this.obtenerFilaRespuestas(egresado),
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([
            encabezados,
            ...filas,
        ]);

        const ultimaFila = filas.length + 1;
        const ultimaColumna = encabezados.length - 1;

        // Filtro en la cabecera.
        worksheet['!autofilter'] = {
            ref: `A1:AC${ultimaFila}`,
        };

        // Estilo de la cabecera.
        for (let columna = 0; columna <= ultimaColumna; columna++) {

            const direccionCelda = XLSX.utils.encode_cell({
                r: 0,
                c: columna,
            });

            const celda = worksheet[direccionCelda];

            if (!celda) {
                continue;
            }

            celda.s = {
                fill: {
                    patternType: 'solid',
                    fgColor: {
                        rgb: 'FF0A41',
                    },
                },
                font: {
                    bold: true,
                    color: {
                        rgb: 'FFFFFF',
                    },
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                    wrapText: true,
                },
                border: {
                    top: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    bottom: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    left: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    right: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                },
            };

        }

        // Altura de la cabecera.
        worksheet['!rows'] = [
            { hpt: 28 },
        ];

        // Anchos de columnas.
        worksheet['!cols'] = [
            { wch: 40 },
            { wch: 15 },
            { wch: 40 },
            { wch: 20 },
            { wch: 20 },
            { wch: 40 },
            { wch: 40 },
            ...Array.from({ length: 22 }, () => ({ wch: 28 })),
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Registros',
        );

        const worksheetResumen = this.crearHojaResumen(
            XLSX,
            this.egresadosVisibles,
        );

        XLSX.utils.book_append_sheet(
            workbook,
            worksheetResumen,
            'Resumen',
        );

        const worksheetProgramaSede = this.crearHojaProgramaSede(
            XLSX,
            this.egresadosVisibles,
        );

        XLSX.utils.book_append_sheet(
            workbook,
            worksheetProgramaSede,
            'Programas y Sedes',
        );

        const fecha = new Date()
            .toISOString()
            .slice(0, 10);

        const fase = (this.faseSeleccionada?.titulo ?? 'sin-fase')
            .toLowerCase()
            .replace(/\s+/g, '-');

        XLSX.writeFile(
            workbook,
            `egresados-${fase}-${fecha}.xlsx`,
        );

    }

    async exportarRegistrosExcelCompleto(): Promise<void> {

		const XLSXModule: any = await import('xlsx-js-style');
		const XLSX: any = XLSXModule.utils ? XLSXModule : XLSXModule.default;

        if (this.egresadosVisibles.length === 0) {
            console.warn('No hay registros visibles para exportar.');
            return;
        }

        const encabezados = [
            'Nombres Completos',
            'Fase',
            'Año de Egreso',
            'Correo Electrónico',
            'Número de Celular',
            'Sede',
            'Facultad',
            'Programa',
            ...this.obtenerEncabezadosRespuestas(),
        ];

        const filas = this.aplicarOrden(this.egresadoBK).map((egresado) => [
            egresado.nombresApellidos,
            egresado.anioEgreso == this.anioActual     || egresado.anioEgreso >= this.anioActual - 3 ? 'Fase 1' :
            egresado.anioEgreso == this.anioActual - 4 || egresado.anioEgreso == this.anioActual - 5 ? 'Fase 2' :
            egresado.anioEgreso == this.anioActual - 6 || egresado.anioEgreso == this.anioActual - 7 ? 'Fase 3' : 'Fase 4',
            egresado.anioEgreso,
            egresado.correoElectronico,
            egresado.numeroCelular,
            egresado.sede,
            egresado.facultad,
            egresado.carrera,
            ...this.obtenerFilaRespuestas(egresado),
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([
            encabezados,
            ...filas,
        ]);

        const ultimaFila = filas.length + 1;
        const ultimaColumna = encabezados.length - 1;

        // Filtro en la cabecera.
        worksheet['!autofilter'] = {
            ref: `A1:AD${ultimaFila}`,
        };

        // Estilo de la cabecera.
        for (let columna = 0; columna <= ultimaColumna; columna++) {

            const direccionCelda = XLSX.utils.encode_cell({
                r: 0,
                c: columna,
            });

            const celda = worksheet[direccionCelda];

            if (!celda) {
                continue;
            }

            celda.s = {
                fill: {
                    patternType: 'solid',
                    fgColor: {
                        rgb: 'FF0A41',
                    },
                },
                font: {
                    bold: true,
                    color: {
                        rgb: 'FFFFFF',
                    },
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                    wrapText: true,
                },
                border: {
                    top: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    bottom: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    left: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                    right: {
                        style: 'thin',
                        color: { rgb: 'D9E2F3' },
                    },
                },
            };

        }

        // Altura de la cabecera.
        worksheet['!rows'] = [
            { hpt: 28 },
        ];

        // Anchos de columnas.
        worksheet['!cols'] = [
            { wch: 40 },
            { wch: 15 },
            { wch: 15 },
            { wch: 40 },
            { wch: 20 },
            { wch: 20 },
            { wch: 40 },
            { wch: 60 },
            ...Array.from({ length: 22 }, () => ({ wch: 28 })),
        ];

        const workbook = XLSX.utils.book_new();

        const worksheetResumen = this.crearHojaResumen(
            XLSX,
            this.egresadoBK,
        );

        const worksheetProgramaSede = this.crearHojaProgramaSede(
            XLSX,
            this.egresadoBK,
        );

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Registros',
        );

        XLSX.utils.book_append_sheet(
            workbook,
            worksheetResumen,
            'Resumen',
        );

        XLSX.utils.book_append_sheet(
            workbook,
            worksheetProgramaSede,
            'Programas y Sedes',
        );

        const fecha = new Date()
            .toISOString()
            .slice(0, 10);

        const fase = (this.faseSeleccionada?.titulo ?? 'sin-fase')
            .toLowerCase()
            .replace(/\s+/g, '-');

        XLSX.writeFile(
            workbook,
            `egresados-${fase}-${fecha}.xlsx`,
        );

    }


    popupDescargarExcel() {

        Swal.fire({
            title: 'Registro de egresados',
            text: '¿Desea descargar todos los registros o por fase?',
            icon: 'warning',

            showDenyButton: true, // segundo botón
            showCancelButton: true, // botón de cancelar

            confirmButtonText: 'Por Fase',
            denyButtonText: 'Completo',
            cancelButtonText: 'Cancelar',
        })
        .then((result) => {

            if (result.isConfirmed) {
                // FUNCIÓN 1
                this.exportarRegistrosExcel();
            }

            else if (result.isDenied) {
                // FUNCIÓN 2
                this.exportarRegistrosExcelCompleto();
            }

        });

    }


	// Función: Calcula el ancho porcentual de la barra de una fase.
	obtenerAnchoBarraFase(fase: FaseDashboard): number {
		return Math.round((fase.egresados.length / this.cantidadMaximaGraficoFases) * 100);
	}


	// Función: Calcula el ancho porcentual de la barra de un año.
	obtenerAnchoBarraAnio(cantidad: number): number {
		return Math.round((cantidad / this.cantidadMaximaGraficoAnios) * 100);
	}


	// Función: Une los nombres y apellidos del egresado.
	obtenerNombreCompleto(egresado: EgresadoBK): string {
		return egresado.nombresApellidos;
	}


	// Función: Optimiza el renderizado de fases dentro del *ngFor.
	identificarFase = (_: number, fase: FaseDashboard): string => {
		return fase.id;
	};


	// Función: Optimiza el renderizado de egresados dentro del *ngFor.
	identificarEgresado(_: number, egresado: EgresadoBK): string {
		return `${egresado.numeroDocumento}-${egresado.anioEgreso}-${egresado.carrera}-${egresado.correoElectronico}`;
	}


	// Función: Construye todas las fases y asigna sus egresados según el año de egreso.
	private construirFases(): FaseDashboard[] {

		return this.plantillasFases.map((plantilla) => {
			const anios = this.obtenerAniosPorFase(plantilla);

			const egresados = this.egresadoBK
				.filter((egresado) => anios.includes(Number(egresado.anioEgreso)))
				.sort((a, b) => Number(b.anioEgreso) - Number(a.anioEgreso));

			return {
				id: plantilla.id,
				titulo: plantilla.titulo,
				etiquetaCohorte: plantilla.etiquetaCohorte,
				anios,
				egresados,
				descripcion: plantilla.descripcion,
				imagen: plantilla.imagen,
			};
		});
	}


	// Función: Calcula los años que pertenecen a una fase según el año actual.
	private obtenerAniosPorFase(plantilla: PlantillaFase): number[] {

		const aniosEgreso = this.egresadoBK.map((egresado) => Number(egresado.anioEgreso));
		const anioMaximoDatos = Math.max(...aniosEgreso, this.anioActual);
		const anioMinimoDatos = Math.min(...aniosEgreso, this.anioActual - 8);

		const anioInicio = Math.min(this.anioActual - plantilla.aniosMinimosDesdeEgreso, anioMaximoDatos);

		const anioFin = plantilla.aniosMaximosDesdeEgreso === null
			? anioMinimoDatos
			: this.anioActual - plantilla.aniosMaximosDesdeEgreso;

		const anios: number[] = [];

		for (let anio = anioInicio; anio >= anioFin; anio--) {
			anios.push(anio);
		}

		return anios;

	}


	// Función: Selecciona automáticamente la primera fase que tenga egresados registrados.
	private obtenerIdFaseInicial(): string {
		const primeraFaseConDatos = this.fases.find((fase) => fase.egresados.length > 0);
		return primeraFaseConDatos?.id ?? this.fases[0]?.id ?? '';
	}


	// Función: Devuelve true si el egresado cumple el texto buscado en cualquiera de los seis campos de la tabla.
	private cumpleFiltroTexto(egresado: EgresadoBK): boolean {
		const texto = this.normalizarTexto(this.filtroTexto);

		if (!texto) {
			return true;
		}

		const camposBuscables = [
			this.obtenerNombreCompleto(egresado),
			String(egresado.anioEgreso),
			egresado.correoElectronico,
			egresado.carrera,
			egresado.sede,
			egresado.facultad,
			egresado.numeroDocumento,
		];

		return camposBuscables.some((campo) => this.normalizarTexto(campo).includes(texto));
	}


	// Función: Aplica todos los criterios activos de filtro sobre un listado de egresados.
	private aplicarCriterios(egresados: EgresadoBK[]): EgresadoBK[] {
		return egresados.filter((egresado) => {
			const coincideTexto = this.cumpleFiltroTexto(egresado);
			const coincideCarrera = !this.filtroCarrera || egresado.carrera === this.filtroCarrera;
			const coincideFacultad = !this.filtroFacultad || egresado.facultad === this.filtroFacultad;
			const coincideSede = !this.filtroSede || egresado.sede === this.filtroSede;
			const coincideAnio = !this.filtroAnio || String(egresado.anioEgreso) === this.filtroAnio;

			return coincideTexto && coincideCarrera && coincideFacultad && coincideSede && coincideAnio;
		});
	}


	// Función: Ordena alfabéticamente (o numéricamente para el año) según la columna y dirección seleccionadas.
	private aplicarOrden(egresados: EgresadoBK[]): EgresadoBK[] {

		if (!this.columnaOrden) {
			return egresados;
		}

		const columna = this.columnaOrden;
		const signo = this.direccionOrden === 'asc' ? 1 : -1;

		return [...egresados].sort((a, b) => {

			if (columna === 'anioEgreso') {
				return (Number(a.anioEgreso) - Number(b.anioEgreso)) * signo;
			}

			return this.normalizarTexto(a[columna] ?? '').localeCompare(this.normalizarTexto(b[columna] ?? '')) * signo;

		});

	}


	// Función: Devuelve una lista única y ordenada alfabéticamente de valores para poblar los selects.
	private obtenerOpcionesUnicas(valores: string[]): string[] {
		return Array.from(new Set(valores)).sort((a, b) => a.localeCompare(b));
	}


	// Función: Normaliza texto para comparación sin tildes y sin distinguir mayúsculas.
	private normalizarTexto(valor: string): string {
		return valor
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
	}


	// Función: Evita que la página actual quede fuera de rango tras filtros o cambios de datos.
	private ajustarPaginaActual(): void {

		if (this.paginaActual > this.totalPaginas) {
			this.paginaActual = this.totalPaginas;
		}

		if (this.paginaActual < 1) {
			this.paginaActual = 1;
		}

	}

    obtenerEncuestados() {

        this._http.get('consultar-encuestados').subscribe({

            next: (res) => {

                // console.log(res.lista);
                this.egresadoBK = res.lista;
				this.fases = this.construirFases();
				this.idFaseSeleccionada = this.obtenerIdFaseInicial();
				this.paginaActual = 1;

                this.cdr.detectChanges();

            },

            error: (err) => {

                console.error('Error al obtener los encuestados:', err);
                Alertas.porErrorHttp(err, 'No se pudo cargar la lista de egresados. Inténtelo nuevamente más tarde.');

            }

        });

    }



}

