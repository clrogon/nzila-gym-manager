export function bookingPromotedTemplate(vars: {
  memberName: string;
  classTitle: string;
  classDate: Date;
}) {
  return `
    Olá ${vars.memberName},

    Boa notícia 🎉

    Uma vaga ficou disponível e a sua inscrição foi confirmada.

    Aula: ${vars.classTitle}
    Data: ${vars.classDate.toLocaleString()}

    Até já,
    A equipa do ginásio
  `;
}
