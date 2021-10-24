'use strict';
const excelToJson = require('convert-excel-to-json');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const _ = require('lodash');
const { group } = require('console');

if (!fs.existsSync('./MaiYea_Navigation.xlsx')) {
    throw Error('MaiYea_Navigation.xlsx does not exist.');
}

const result = excelToJson({
    sourceFile: 'MaiYea_Navigation.xlsx',
    columnToKey: {
        A: 'l1_cname',
        B: 'l1_ename',
        C: 'l1_tag',
        D: 'l2_cname',
        E: 'l2_ename',
        F: 'l2_tag',
        G: 'l3_cname',
        H: 'l3_ename',
        I: 'l3_tag',
    },
    header: {
        rows: 2,
    },
});

const currentSheet = _.get(result, ['選單對照表']);

function reduce(group = currentSheet, csheet = currentSheet, deep = 1, deepMax = 3) {
    return _.chain(group).groupBy(`l${deep}_tag`).map((gp, _tag) => {
        // Should have children
        const sheet = csheet.filter(cs => cs[`l${deep}_tag`] === _tag);
        const cs0 = sheet[0];
        return {
            id: uuid(),
            labelEn: cs0[`l${deep}_ename`],
            labelZh: cs0[`l${deep}_cname`],
            tag: cs0[`l${deep}_tag`],
            image: deep === deepMax ? `statics/menu/${cs0[`l${deep}_tag`]}.jpg` : '', // Only final level has image
            imageLoaded: false,
            visible: true,
            children: deepMax > deep ? reduce(gp, sheet, deep + 1) : [],
        };
    });
}

fs.writeFileSync('Navigation.json', JSON.stringify(reduce(), null, 4));


/**
 * @deprecated
 */
function lagecyParse() {
    let layer1 = _.chain(currentSheet).groupBy('l1_tag').map((group1, tag1) => {
        // return _.groupBy(group1, 'l2_tag');  
        // 取得資料表列指定 tag 第一項即可

        const level2 = _.chain(group1).groupBy('l2_tag').map((group2, tag2) => {

            const level3 = _.chain(group2).groupBy('l3_tag').map((group3, tag3) => {
                const cs3 = currentSheet.find(cs => cs.l1_tag === tag1 && cs.l2_tag === tag2 && cs.l3_tag === tag3);
                return {
                    id: uuid(),
                    labelEn: cs3.l3_ename,
                    labelZh: cs3.l3_cname,
                    tag: cs3.l3_tag,
                    image: '', // Level1 do not need image
                    imageLoaded: false,
                    visible: true,
                    children: [],
                }
            });

            const cs2 = currentSheet.find(cs => cs.l1_tag === tag1 && cs.l2_tag === tag2);
            return {
                id: uuid(),
                labelEn: cs2.l2_ename,
                labelZh: cs2.l2_cname,
                tag: cs2.l2_tag,
                image: '', // Level1 do not need image
                imageLoaded: false,
                visible: true,
                children: level3,
            }
        });

        const cs1 = currentSheet.find(cs => cs.l1_tag === tag1);
        const level1 = {
            id: uuid(),
            labelEn: cs1.l1_ename,
            labelZh: cs1.l1_cname,
            tag: cs1.l1_tag,
            image: '', // Level1 do not need image
            imageLoaded: false,
            visible: true,
            children: level2,
        };
        return level1;
    }).value();

    fs.writeFileSync('Navigation.json', JSON.stringify(layer1, null, 4));
}