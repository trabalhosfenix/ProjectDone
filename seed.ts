import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function ensureStatusOptions() {
  const defaults = [
    { label: 'A Fazer', color: '#94a3b8', isFinal: false },
    { label: 'Em Andamento', color: '#3b82f6', isFinal: false },
    { label: 'Concluído', color: '#22c55e', isFinal: true },
    { label: 'Bloqueado', color: '#ef4444', isFinal: false },
  ]

  for (const option of defaults) {
    await prisma.statusOption.upsert({
      where: { label: option.label },
      update: option,
      create: option,
    })
  }
}

async function ensureIssueStatuses() {
  const statuses = [
    { label: 'Aberta', color: '#3b82f6', isDefault: true, isFinal: false, order: 1 },
    { label: 'Em andamento', color: '#f59e0b', isDefault: false, isFinal: false, order: 2 },
    { label: 'Resolvida', color: '#22c55e', isDefault: false, isFinal: true, order: 3 },
  ]

  for (const status of statuses) {
    await prisma.issueStatus.upsert({
      where: { label: status.label },
      update: status,
      create: status,
    })
  }
}

async function main() {
  await ensureStatusOptions()
  await ensureIssueStatuses()

  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {
      name: 'Administrador',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@empresa.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const planner = await prisma.user.upsert({
    where: { email: 'planejamento@empresa.com' },
    update: { name: 'Ana Planejamento', role: 'USER' },
    create: {
      email: 'planejamento@empresa.com',
      name: 'Ana Planejamento',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
      jobTitle: 'Planejadora',
    },
  })

  const qa = await prisma.user.upsert({
    where: { email: 'qa@empresa.com' },
    update: { name: 'Carlos QA', role: 'USER' },
    create: {
      email: 'qa@empresa.com',
      name: 'Carlos QA',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
      jobTitle: 'Analista de Testes',
    },
  })

  let calendar = await prisma.workCalendar.findFirst({
    where: { name: 'Calendário Seed Completo' },
    include: { holidays: true },
  })

  if (!calendar) {
    calendar = await prisma.workCalendar.create({
      data: {
        name: 'Calendário Seed Completo',
        description: 'Calendário para seed de projeto completo',
        type: 'BUSINESS_DAYS',
        workHoursPerDay: 8,
      },
      include: { holidays: true },
    })
  }

  await prisma.calendarHoliday.deleteMany({ where: { calendarId: calendar.id } })
  await prisma.calendarHoliday.createMany({
    data: [
      { calendarId: calendar.id, name: 'Confraternização Universal', date: new Date('2026-01-01'), recurring: true },
      { calendarId: calendar.id, name: 'Corpus Christi', date: new Date('2026-06-04'), recurring: false },
    ],
  })

  const project = await prisma.project.upsert({
    where: { code: 'SEED-PROJ-COMPLETO' },
    update: {
      name: 'Projeto Seed Completo',
      description: 'Projeto de validação completa das funcionalidades da plataforma.',
      status: 'Andamento',
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-04-30'),
      createdById: admin.id,
      workCalendarId: calendar.id,
      managerId: admin.id,
      managerName: admin.name,
      progress: 42,
      budget: 450000,
      actualCost: 175000,
      plannedEffort: 1800,
      actualEffort: 760,
    },
    create: {
      code: 'SEED-PROJ-COMPLETO',
      name: 'Projeto Seed Completo',
      description: 'Projeto de validação completa das funcionalidades da plataforma.',
      status: 'Andamento',
      createdById: admin.id,
      managerId: admin.id,
      managerName: admin.name || 'Administrador',
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-04-30'),
      progress: 42,
      budget: 450000,
      actualCost: 175000,
      plannedEffort: 1800,
      actualEffort: 760,
      workCalendarId: calendar.id,
      type: 'Implementação',
      client: 'Cliente Seed',
    },
  })

  const existingIssues = await prisma.issue.findMany({
    where: { projectId: project.id },
    select: { id: true },
  })
  const issueIds = existingIssues.map((i) => i.id)

  if (issueIds.length > 0) {
    await prisma.issueComment.deleteMany({ where: { issueId: { in: issueIds } } })
    await prisma.issueMember.deleteMany({ where: { issueId: { in: issueIds } } })
  }

  const existingItems = await prisma.projectItem.findMany({
    where: { projectId: project.id },
    select: { id: true },
  })
  const itemIds = existingItems.map((i) => i.id)

  if (itemIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { projectItemId: { in: itemIds } } })
    await prisma.comment.deleteMany({ where: { projectItemId: { in: itemIds } } })
    await prisma.document.deleteMany({ where: { projectItemId: { in: itemIds } } })
  }

  await prisma.projectRecord.deleteMany({ where: { projectId: project.id } })
  await prisma.projectRisk.deleteMany({ where: { projectId: project.id } })
  await prisma.projectGoal.deleteMany({ where: { projectId: project.id } })
  await prisma.projectGoalType.deleteMany({ where: { projectId: project.id } })
  await prisma.cutoverTask.deleteMany({ where: { projectId: project.id } })
  await prisma.testScenario.deleteMany({ where: { projectId: project.id } })
  await prisma.issue.deleteMany({ where: { projectId: project.id } })
  await prisma.projectDocument.deleteMany({ where: { projectId: project.id } })
  await prisma.projectItem.deleteMany({ where: { projectId: project.id } })
  await prisma.projectMember.deleteMany({ where: { projectId: project.id } })

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id, role: 'Gerente', effort: 220, cost: 150, revenue: 250 },
      { projectId: project.id, userId: planner.id, role: 'Planejamento', effort: 300, cost: 110, revenue: 180 },
      { projectId: project.id, userId: qa.id, role: 'QA', effort: 260, cost: 95, revenue: 160 },
    ],
  })

  const kickoff = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '1',
      task: 'Iniciação e Planejamento',
      responsible: admin.name,
      status: 'Concluído',
      priority: 'Alta',
      datePlanned: new Date('2026-01-05'),
      datePlannedEnd: new Date('2026-01-20'),
      dateActualStart: new Date('2026-01-05'),
      dateActual: new Date('2026-01-19'),
      duration: 12,
      metadata: { progress: 1, predecessors: '', duration: 12 },
    },
  })

  const wbs11 = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '1.1',
      task: 'Kickoff com stakeholders',
      responsible: admin.name,
      status: 'Concluído',
      priority: 'Alta',
      datePlanned: new Date('2026-01-05'),
      datePlannedEnd: new Date('2026-01-07'),
      dateActualStart: new Date('2026-01-05'),
      dateActual: new Date('2026-01-07'),
      duration: 3,
      metadata: { progress: 1, predecessors: '', duration: 3 },
    },
  })

  const wbs12 = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '1.2',
      task: 'Planejamento detalhado',
      responsible: planner.name,
      status: 'Concluído',
      priority: 'Alta',
      datePlanned: new Date('2026-01-08'),
      datePlannedEnd: new Date('2026-01-20'),
      dateActualStart: new Date('2026-01-08'),
      dateActual: new Date('2026-01-19'),
      duration: 9,
      metadata: { progress: 1, predecessors: '1.1FS', duration: 9 },
    },
  })

  const execucao = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '2',
      task: 'Execução e Entregas',
      responsible: planner.name,
      status: 'Em Andamento',
      priority: 'Alta',
      datePlanned: new Date('2026-01-21'),
      datePlannedEnd: new Date('2026-04-10'),
      duration: 58,
      metadata: { progress: 0.56, predecessors: '1.2FS', duration: 58 },
    },
  })

  const wbs21 = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '2.1',
      task: 'Construção de integrações',
      responsible: planner.name,
      status: 'Em Andamento',
      priority: 'Alta',
      datePlanned: new Date('2026-01-21'),
      datePlannedEnd: new Date('2026-03-05'),
      dateActualStart: new Date('2026-01-22'),
      duration: 32,
      metadata: { progress: 0.72, predecessors: '1.2FS', duration: 32 },
    },
  })

  const wbs22 = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '2.2',
      task: 'Homologação integrada',
      responsible: qa.name,
      status: 'A Fazer',
      priority: 'Média',
      datePlanned: new Date('2026-03-06'),
      datePlannedEnd: new Date('2026-04-10'),
      duration: 26,
      metadata: { progress: 0.08, predecessors: '2.1FS', duration: 26 },
    },
  })

  const encerramento = await prisma.projectItem.create({
    data: {
      projectId: project.id,
      originSheet: 'MSPROJECT_IMPORT',
      wbs: '3',
      task: 'Encerramento',
      responsible: admin.name,
      status: 'A Fazer',
      priority: 'Média',
      datePlanned: new Date('2026-04-13'),
      datePlannedEnd: new Date('2026-04-30'),
      duration: 14,
      metadata: { progress: 0, predecessors: '2.2FS', duration: 14 },
    },
  })

  await prisma.projectItem.update({ where: { id: wbs12.id }, data: { predecessors: { connect: { id: wbs11.id } } } })
  await prisma.projectItem.update({ where: { id: execucao.id }, data: { predecessors: { connect: { id: wbs12.id } } } })
  await prisma.projectItem.update({ where: { id: wbs21.id }, data: { predecessors: { connect: { id: wbs12.id } } } })
  await prisma.projectItem.update({ where: { id: wbs22.id }, data: { predecessors: { connect: { id: wbs21.id } } } })
  await prisma.projectItem.update({ where: { id: encerramento.id }, data: { predecessors: { connect: { id: wbs22.id } } } })

  await prisma.projectRisk.createMany({
    data: [
      {
        projectId: project.id,
        description: 'Atraso na entrega de fornecedor externo',
        type: 'Ameaça',
        category: 'Externo',
        probability: 4,
        impact: 5,
        severity: 20,
        responseStrategy: 'Mitigar',
        responsePlan: 'Plano alternativo com fornecedor secundário',
        status: 'Ativo',
        owner: planner.name || 'Ana Planejamento',
      },
      {
        projectId: project.id,
        description: 'Baixa adesão dos key users nos testes',
        type: 'Ameaça',
        category: 'Operacional',
        probability: 3,
        impact: 4,
        severity: 12,
        responseStrategy: 'Mitigar',
        responsePlan: 'Reforçar agenda de acompanhamento semanal',
        status: 'Monitorado',
        owner: qa.name || 'Carlos QA',
      },
    ],
  })

  const qualityType = await prisma.projectGoalType.create({
    data: {
      projectId: project.id,
      name: 'Qualidade',
      dataType: 'Percentual',
      unit: '%',
    },
  })

  await prisma.projectGoal.create({
    data: {
      projectId: project.id,
      typeId: qualityType.id,
      name: 'Cobertura de Testes Integrados',
      description: 'Percentual de cenários homologados com sucesso',
      targetValue: 95,
      currentValue: 62,
      status: 'Em andamento',
      dueDate: new Date('2026-04-15'),
    },
  })

  await prisma.testScenario.createMany({
    data: [
      {
        projectId: project.id,
        externalId: 'OUT-T001',
        scenario: 'Cadastro de Cliente',
        task: 'Criar e validar cliente com dados completos',
        status: 'Keyuser - Concluído',
        responsible: qa.name,
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-11'),
      },
      {
        projectId: project.id,
        externalId: 'OUT-T002',
        scenario: 'Integração Faturamento',
        task: 'Validar integração API com ERP',
        status: 'Não iniciado',
        responsible: qa.name,
        startDate: new Date('2026-03-12'),
        endDate: new Date('2026-03-14'),
      },
      {
        projectId: project.id,
        externalId: 'OUT-T003',
        scenario: 'Fluxo de Aprovação',
        task: 'Executar fluxo completo com aprovação e rejeição',
        status: 'Bloqueado',
        responsible: planner.name,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-18'),
      },
    ],
  })

  await prisma.cutoverTask.createMany({
    data: [
      {
        projectId: project.id,
        order: 1,
        activity: 'Congelar mudanças em produção',
        predecessor: '',
        responsible: admin.name,
        duration: 2,
        startDate: new Date('2026-04-25T08:00:00Z'),
        endDate: new Date('2026-04-25T10:00:00Z'),
        percentComplete: 100,
        percentPlanned: 100,
        status: 'completed',
      },
      {
        projectId: project.id,
        order: 2,
        activity: 'Executar carga inicial',
        predecessor: '1',
        responsible: planner.name,
        duration: 4,
        startDate: new Date('2026-04-25T10:30:00Z'),
        endDate: new Date('2026-04-25T14:30:00Z'),
        percentComplete: 60,
        percentPlanned: 100,
        status: 'in_progress',
      },
      {
        projectId: project.id,
        order: 3,
        activity: 'Validação pós-go-live',
        predecessor: '2',
        responsible: qa.name,
        duration: 3,
        startDate: new Date('2026-04-25T15:00:00Z'),
        endDate: new Date('2026-04-25T18:00:00Z'),
        percentComplete: 0,
        percentPlanned: 40,
        status: 'pending',
      },
    ],
  })

  const openStatus = await prisma.issueStatus.findUnique({ where: { label: 'Aberta' } })

  const issue = await prisma.issue.create({
    data: {
      projectId: project.id,
      title: 'Ambiente de homologação indisponível em horários de pico',
      description: 'Intermitência afeta execução dos cenários integrados.',
      type: 'INTERNAL',
      statusId: openStatus?.id,
      priority: 'HIGH',
      createdById: admin.id,
      plannedStart: new Date('2026-03-20'),
      plannedEnd: new Date('2026-03-28'),
    },
  })

  await prisma.issueMember.create({
    data: {
      issueId: issue.id,
      userId: qa.id,
      role: 'RESPONSIBLE',
    },
  })

  await prisma.issueComment.create({
    data: {
      issueId: issue.id,
      userId: admin.id,
      content: 'Abrimos ticket com infraestrutura e plano de contingência.',
    },
  })

  await prisma.projectRecord.create({
    data: {
      projectId: project.id,
      publishedById: admin.id,
      executedById: planner.id,
      comment: 'Seed completo criado para validação de features ponta-a-ponta.',
      revenue: 12500,
    },
  })

  await prisma.projectDocument.create({
    data: {
      projectId: project.id,
      name: 'Plano Mestre do Projeto',
      description: 'Documento base para planejamento e acompanhamento',
      type: 'PDF',
      url: '/uploads/plano_mestre_seed.pdf',
      category: 'Planejamento',
      uploadedById: admin.id,
      uploadedByName: admin.name,
    },
  })

  await prisma.project.update({
    where: { id: project.id },
    data: {
      metadata: {
        seeded: true,
        includes: {
          gantt: true,
          eap: true,
          dependencies: true,
          risks: true,
          tests: true,
          cutover: true,
          issues: true,
          goals: true,
        },
      },
    },
  })

  console.log('✅ Seed completo criado com sucesso!')
  console.log(`Projeto: ${project.name} (${project.code})`)
  console.log(`Admin: ${admin.email}`)
  console.log('Credenciais admin: admin@empresa.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
