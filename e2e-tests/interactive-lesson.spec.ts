import { expect, test } from '@playwright/test';
import { getQuizForLesson } from '../src/data/quizBank';

test('termine une leçon SQL Injection avec son quiz de 20 questions', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');

  await page.getByRole('button', { name: 'Continuer le parcours' }).click();
  const lesson = page.getByRole('dialog', { name: 'Leçon SQL Injection' });
  await expect(lesson.getByRole('heading', { name: 'SQL Injection : comprendre pour mieux protéger' })).toBeVisible();

  await lesson.getByRole('button', { name: 'Continuer' }).click();
  await expect(lesson.getByRole('heading', { name: 'Suivez le parcours d’une donnée' })).toBeVisible();
  await lesson.getByRole('button', { name: 'Continuer' }).click();

  await lesson.getByLabel('Valeur à tester').fill("' OR '1'='1");
  await lesson.getByRole('button', { name: 'Lancer le test' }).click();
  await expect(lesson.getByText(/Entrée suspecte détectée dans le scénario fictif/)).toBeVisible();

  await lesson.getByRole('button', { name: 'Continuer' }).click();
  await expect(lesson.getByRole('heading', { name: 'Du code fragile au code défensif' })).toBeVisible();
  await lesson.getByRole('button', { name: 'Continuer' }).click();

  const questions = getQuizForLesson('SQL Injection');
  expect(questions).toHaveLength(20);
  for (let index = 0; index < questions.length; index++) {
    await expect(lesson.getByText(`QUESTION ${index + 1} / 20`)).toBeVisible();
    await lesson.locator('.quiz-options button').nth(questions[index].correct).click();
    await lesson.getByRole('button', { name: index === questions.length - 1 ? 'Voir mon résultat' : 'Question suivante' }).click();
  }

  await expect(lesson.getByText('Votre résultat :').locator('..')).toContainText('100 %');
  await expect(lesson.getByRole('heading', { name: 'Bien joué !' })).toBeVisible();

  await lesson.getByRole('button', { name: 'Continuer' }).click();
  await expect(lesson.getByRole('heading', { name: 'Les bons réflexes à retenir' })).toBeVisible();
  await lesson.getByRole('button', { name: 'Terminer la leçon' }).click();
  await expect(page.getByRole('dialog', { name: 'Leçon SQL Injection' })).toBeHidden();
  await expect(page.getByText('Progression enregistrée')).toBeVisible();
  await expect(page.getByText('1 sur 12 leçons')).toBeVisible();
});
