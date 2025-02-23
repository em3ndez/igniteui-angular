import { EmptyTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { scssImport, cssImport } from './add-normalize';
import { DEPENDENCIES_MAP, PackageTarget, PackageEntry } from '../utils/dependency-handler';
import { ProjectType } from '../utils/util';

describe('ng-add schematics', () => {
  const collectionPath = path.join(__dirname, '../collection.json');
  const runner: SchematicTestRunner = new SchematicTestRunner('cli-schematics', collectionPath);
  let tree: UnitTestTree;
  const sourceRoot = 'testSrc';
  const ngJsonConfig = {
    defaultProject: 'testProj',
    version: 1,
    projects: {
      testProj: {
        sourceRoot,
        projectType: ProjectType.Application,
        architect: {
          serve: {},
          build: {
            options: {
              main: `${sourceRoot}/main.ts`,
              polyfills: `${sourceRoot}/polyfills.ts`,
              scripts: []
            }
          },
          test: {
            options: {
              main: `${sourceRoot}/test.ts`,
              polyfills: `${sourceRoot}/polyfills.ts`,
              scripts: []
            }
          },
        }
      }
    }
  };

  const pkgJsonConfig = {
    dependencies: {},
    devDependencies: {}
  };

  const resetJsonConfigs = (treeArg: UnitTestTree) => {
    treeArg.overwrite('/angular.json', JSON.stringify(ngJsonConfig));
    treeArg.overwrite('/package.json', JSON.stringify(pkgJsonConfig));
  };

  beforeEach(() => {
    tree = new UnitTestTree(new EmptyTree());
    tree.create('/angular.json', JSON.stringify(ngJsonConfig));
    tree.create('/package.json', JSON.stringify(pkgJsonConfig));
    tree.create(`${sourceRoot}/main.ts`, '// test comment');
    tree.create(`${sourceRoot}/test.ts`, '// test comment');
  });

  it('should include ALL dependencies in map', () => {
    const pkgJson = require('../../package.json');
    const allDependencies = Object.assign({}, pkgJson.dependencies, pkgJson.peerDependencies, pkgJson.igxDevDependencies);
    for (const key of Object.keys(allDependencies)) {
      const expectedPackages: PackageEntry = {
        name: key,
        target: jasmine.anything() as any
      };
      expect(DEPENDENCIES_MAP).toContain(expectedPackages, `Dependency ${key} missing in dependencies map!`);
    }
  });

  it('should add packages to package.json dependencies', async () => {
    const expectedDeps = DEPENDENCIES_MAP.filter(dep => dep.target === PackageTarget.REGULAR).map(dep => dep.name);
    const expectedDevDeps = DEPENDENCIES_MAP.filter(dep => dep.target === PackageTarget.DEV).map(dep => dep.name);
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(pkgJsonData.dependencies).toBeTruthy();
    expect(pkgJsonData.devDependencies).toBeTruthy();
    // Check for explicit dependencies
    expect(Object.keys(pkgJsonData.dependencies).length).toEqual(expectedDeps.length, `Different number of added dependencies!`);
    expect(Object.keys(pkgJsonData.devDependencies).length).toEqual(expectedDevDeps.length, `Different number of added devDependencies!`);
    for (const dependency of expectedDeps) {
      expect(pkgJsonData.dependencies.hasOwnProperty(dependency)).toEqual(true, `Dependency ${dependency} is missing from output!`);
    }
    for (const dependency of expectedDevDeps) {
      expect(pkgJsonData.devDependencies.hasOwnProperty(dependency)).toEqual(true, `DevDependency ${dependency} is missing from output!`);
    }
  });

  it('should add the correct igniteui-angular packages to package.json dependencies', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(pkgJsonData.dependencies['jszip']).toBeTruthy();
    expect(pkgJsonData.dependencies['hammerjs']).toBeTruthy();
  });

  it('should NOT add hammer.js to the main.ts file', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const mainTs = tree.read(`${sourceRoot}/main.ts`).toString();
    expect(mainTs).not.toContain('import \'hammerjs\';');
  });

  it('should NOT add hammer.js to the test.ts file', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const testTs = tree.read(`${sourceRoot}/test.ts`).toString();
    expect(testTs).not.toContain('import \'hammerjs\';');
  });

  it('should add hammer.js in angular.json build options under scripts', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const ngJsonConfigResult = JSON.parse(tree.read('/angular.json').toString());
    expect(ngJsonConfigResult.projects.testProj.architect.build.options.scripts).toContain('./node_modules/hammerjs/hammer.min.js');
  });

  it('should add hammer.js in angular.json test options under scripts', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const ngJsonConfigResult = JSON.parse(tree.read('/angular.json').toString());
    expect(ngJsonConfigResult.projects.testProj.architect.test.options.scripts).toContain('./node_modules/hammerjs/hammer.min.js');
  });

  it('should NOT duplicate hammer.js if it exists in angular.json build options', async () => {
    const ngJsonConfig1 = JSON.parse(tree.read('/angular.json').toString());
    ngJsonConfig1.projects.testProj.architect.build.options.scripts.push('./node_modules/hammerjs/hammer.min.js');
    tree.overwrite('/angular.json', JSON.stringify(ngJsonConfig1));
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();

    const ngJsonConfigResult = JSON.parse(tree.read('/angular.json').toString());
    expect(ngJsonConfigResult.projects.testProj.architect.build.options.scripts.length).toBe(1);
    expect(ngJsonConfigResult.projects.testProj.architect.build.options.scripts).toMatch('./node_modules/hammerjs/hammer.min.js');
  });

  it('should NOT duplicate hammer.js if it exists in angular.json test options', async () => {
    const ngJsonConfig1 = JSON.parse(tree.read('/angular.json').toString());
    ngJsonConfig1.projects.testProj.architect.test.options.scripts.push('./node_modules/hammerjs/hammer.min.js');
    tree.overwrite('/angular.json', JSON.stringify(ngJsonConfig1));
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();

    const ngJsonConfigResult = JSON.parse(tree.read('/angular.json').toString());
    expect(ngJsonConfigResult.projects.testProj.architect.test.options.scripts.length).toBe(1);
    expect(ngJsonConfigResult.projects.testProj.architect.test.options.scripts).toMatch('./node_modules/hammerjs/hammer.min.js');
  });

  it('should NOT add hammer.js to main.ts if it exists in angular.json build options', async () => {
    const ngJsonConfig1 = JSON.parse(tree.read('/angular.json').toString());
    ngJsonConfig1.projects.testProj.architect.build.options.scripts.push('./node_modules/hammerjs/hammer.min.js');
    tree.overwrite('/angular.json', JSON.stringify(ngJsonConfig1));
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();

    const newContent = tree.read(`${sourceRoot}/main.ts`).toString();
    expect(newContent).toMatch('// test comment');
  });

  it('should NOT add hammer.js to test.ts if it exists in angular.json test options', async () => {
    const ngJsonConfig1 = JSON.parse(tree.read('/angular.json').toString());
    ngJsonConfig1.projects.testProj.architect.test.options.scripts.push('./node_modules/hammerjs/hammer.min.js');
    tree.overwrite('/angular.json', JSON.stringify(ngJsonConfig1));
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();

    const newContent = tree.read(`${sourceRoot}/test.ts`).toString();
    expect(newContent).toMatch('// test comment');
  });

  it('should add hammer.js to package.json dependencies', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(pkgJsonData.dependencies['hammerjs']).toBeTruthy();
  });

  it('should NOT add hammer.js to angular.json if it exists in main.ts options', async () => {
    const mainTsPath = `${sourceRoot}/main.ts`;
    const content = tree.read(mainTsPath).toString();
    tree.overwrite(mainTsPath, 'import \'hammerjs\';\n' + content);
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();

    const ngJsonConfigResult = JSON.parse(tree.read('/angular.json').toString());
    expect(ngJsonConfigResult.projects.testProj.architect.build.options.scripts.length).toBe(0);
    expect(ngJsonConfigResult.projects.testProj.architect.build.options.scripts).not.toContain('./node_modules/hammerjs/hammer.min.js');
  });

  it('should add the CLI only to devDependencies', async () => {
    await runner.runSchematicAsync('ng-add', { normalizeCss: false }, tree).toPromise();
    const pkgJsonData = JSON.parse(tree.readContent('/package.json'));

    const version = require('../../package.json')['igxDevDependencies']['@igniteui/angular-schematics'];
    expect(pkgJsonData.devDependencies['@igniteui/angular-schematics']).toBe(version);
    expect(pkgJsonData.dependencies['@igniteui/angular-schematics']).toBeFalsy();
  });

  it('should properly add css reset', async () => {
    tree.create(`${sourceRoot}/styles.scss`, '');
    await runner.runSchematicAsync('ng-add', { normalizeCss: true }, tree).toPromise();
    let pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(tree.readContent(`${sourceRoot}/styles.scss`)).toEqual(scssImport);
    expect(pkgJsonData.dependencies['minireset.css']).toBeTruthy();
    resetJsonConfigs(tree);
    tree.delete(`${sourceRoot}/styles.scss`);

    tree.create(`${sourceRoot}/styles.sass`, '');
    await runner.runSchematicAsync('ng-add', { normalizeCss: true }, tree).toPromise();
    pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(tree.readContent(`${sourceRoot}/styles.sass`)).toEqual(scssImport);
    expect(pkgJsonData.dependencies['minireset.css']).toBeTruthy();
    resetJsonConfigs(tree);
    tree.delete(`${sourceRoot}/styles.sass`);

    tree.create(`${sourceRoot}/styles.css`, '');
    await runner.runSchematicAsync('ng-add', { normalizeCss: true }, tree).toPromise();
    pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(tree.readContent(`${sourceRoot}/styles.css`)).toBe('');
    expect(pkgJsonData.dependencies['minireset.css']).toBeTruthy();
    expect(JSON.parse(tree.readContent('/angular.json')).projects['testProj'].architect.build.options.styles).toContain(cssImport);
    resetJsonConfigs(tree);
    tree.delete(`${sourceRoot}/styles.css`);

    tree.create(`${sourceRoot}/styles.less`, '');
    await runner.runSchematicAsync('ng-add', { normalizeCss: true }, tree).toPromise();
    pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(tree.readContent(`${sourceRoot}/styles.less`)).toBe('');
    expect(pkgJsonData.dependencies['minireset.css']).toBeTruthy();
    expect(JSON.parse(tree.readContent('/angular.json')).projects['testProj'].architect.build.options.styles).toContain(cssImport);
    resetJsonConfigs(tree);
    tree.delete(`${sourceRoot}/styles.less`);

    tree.create(`${sourceRoot}/styles.styl`, '');
    await runner.runSchematicAsync('ng-add', { normalizeCss: true }, tree).toPromise();
    pkgJsonData = JSON.parse(tree.readContent('/package.json'));
    expect(tree.readContent(`${sourceRoot}/styles.styl`)).toBe('');
    expect(pkgJsonData.dependencies['minireset.css']).toBeTruthy();
    expect(JSON.parse(tree.readContent('/angular.json')).projects['testProj'].architect.build.options.styles).toContain(cssImport);
    resetJsonConfigs(tree);
    tree.delete(`${sourceRoot}/styles.styl`);
  });

});

