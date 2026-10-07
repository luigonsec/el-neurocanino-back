import { leadSchema, regionSchema } from '../src/leads/schemas';
import { csvCell } from '../src/leads/leads';
import { privacyVersion } from '../src/privacy';
const valid = {
  name: 'Prueba profesional',
  email: 'persona@example.test',
  message: 'Quiero información sobre el programa.',
  privacyAccepted: true,
  privacyVersion,
  website: '',
};
describe('Captación y exportación', () => {
  it('requiere aceptación y la versión vigente del aviso', () => {
    expect(leadSchema.safeParse({ ...valid, privacyAccepted: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, privacyVersion: 'anterior' }).success).toBe(false);
  });
  it('rechaza el campo antispam y códigos de servicio desconocidos', () => {
    expect(leadSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, serviceCode: 'inventado' }).success).toBe(false);
  });
  it('el formulario regional exige ciudad y provincia y no acepta cifras negativas', () => {
    expect(regionSchema.safeParse(valid).success).toBe(false);
    expect(
      regionSchema.safeParse({
        ...valid,
        city: 'Sevilla',
        province: 'Sevilla',
        interestedCount: -1,
      }).success,
    ).toBe(false);
    expect(
      regionSchema.safeParse({ ...valid, city: 'Sevilla', province: 'Sevilla', interestedCount: 8 })
        .success,
    ).toBe(true);
  });
  it('protege el CSV de fórmulas y conserva comillas y saltos de línea', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell('mensaje\n"citado"')).toBe('"mensaje\n""citado"""');
    expect(csvCell('  +SUM(1,2)')).toBe('"\'  +SUM(1,2)"');
  });
});
