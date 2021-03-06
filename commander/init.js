const chalk = require('chalk');
const fs = require('fs');
const ora = require('ora');
const {prompt} = require('inquirer');
const download = require('download-git-repo');

const tplList = require(`${__dirname}/../tpl`);
const { readFile, writeFile } = require('../common');
const tplLists = Object.keys(tplList) || [];


const getQuestions = function(defaultName) {
    return [
        {
            type: 'input',
            name: 'name',
            message: 'Project Name',
            default: defaultName,
            filters(val) {
                return val.trim()
            },
            validate(val) {
                const validate = (val.trim().split(' ')).length === 1;
                return validate || 'Project Name is not allowed to have space';
            }
        },
        {
            type: 'list',
            name: 'template',
            message: 'choice project template',
            choices: tplLists,
            default: tplLists[0]
        },
        {
            type: 'input',
            name: 'description',
            message: 'Project Description',
            default: 'A Vue Project'
        },
        {
            type: 'input',
            name: 'author',
            message: 'Author Name',
            default: 'Project author'
        }
    ]
}

module.exports = function(projectName) {
    if(fs.existsSync(projectName)) {
        console.log(chalk.red('项目名称已存在,请重新输入!'));
        return;
    }
    const defaultName = projectName || 'vue-project';

    prompt(getQuestions(defaultName))
        .then(({name, template, description, author}) => {
            const projectName = name;
            const tplName = template;
            const gitRepo = tplList[tplName].url;
            const gitBranch = tplList[tplName].branch;

            const spiner = ora('Downloading...');
            spiner.start();
            
            download(`${gitRepo}${gitBranch}`, `./${projectName}`, (err) => {
                if(err) {
                    console.log(chalk.red(err))
                    process.exit();
                }
                const packageUrl = `./${projectName}/package.json`
                readFile(packageUrl).then(function(data) {
                    const packageJson = JSON.parse(data);
                    packageJson.name = projectName;
                    packageJson.description = description;
                    packageJson.author = author;
                    
                    const updatedJson = JSON.stringify(packageJson, null, 2);
                    return updatedJson;
                }, function(err) {
                    console.log(chalk.red(err))
                }).then(function(res) {
                    writeFile(packageUrl, res).then(function() {
                        spiner.succeed();
                        console.log('')
                        console.log(chalk.green('项目已成功初始化!'))
                        console.log('')
                        console.log(`${chalk.yellow(`cd ${name}`)}`)
                        console.log(`${chalk.yellow('npm install')}`)
                        console.log(`${chalk.yellow('npm run dev')}`)
                        console.log('')
                    }, function(err) {
                        spiner.fail();
                        console.log(chalk.red(err))
                    })
                })
            })
            console.log(name, template, description, author);
        })
}