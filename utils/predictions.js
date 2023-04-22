class Prediction {
    $predictions;

    constructor($predictions) {
        this.$predictions = $predictions;
    }

    getWinningTips() {
        const data = {
            today: []
        };

        if (this.$predictions.length) {
            data.today = this.$predictions.filter((el) => el.time.status === "FT");

            const wins = [];

            for (const fixture of data.today) {
                const options = this.checkNewOutcome(fixture);
                const checkForNonNull = Object.values(options).some((el) => el !== null);
                if (checkForNonNull && Object.values(options).filter(item => item).length) {
                    if (Object.values(options)[0]) {
                        fixture.label = Object.values(options)[0];
                    } else {
                        fixture.label = Object.values(options)[1];
                    }
                    wins.push(fixture);
                }
            }

            return wins.map((el) => (
                {
                    time: el.time,
                    scores: el.scores,
                    league: el.league,
                    homeTeam: {
                        id: el.homeTeam.id,
                        name: el.homeTeam.name,
                        logo: el.homeTeam.logo,
                        short_code: el.homeTeam.short_code
                    },
                    awayTeam: {
                        id: el.awayTeam.id,
                        name: el.awayTeam.name,
                        logo: el.awayTeam.logo,
                        short_code: el.awayTeam.short_code
                    },
                    label: el.label,
                    cs: Object.keys(el.odds.correct_score).reduce((a, b) => el.odds.correct_score[a] > el.odds.correct_score[b] ? a : b)
                }
            ));
        }

        return [];
    }

    checkOldOutcome(fixture) {
        const $label = fixture.label;
        let outcome = null;

        // @ts-ignore
        if ($label === "1" || $label === "2") {
            const checker = this.checkWin(fixture, $label);
            if (checker) outcome = $label;
            // @ts-ignore
        } else if ($label === "X") {
            const checker = this.checkDraw(fixture);
            if (checker) outcome = $label;
            // @ts-ignore
        } else if ($label === "1X" || $label === "2X") {
            const checker = this.checkWinOrDraw(fixture, $label);
            if (checker) outcome = $label;
        } else {
            const checker = this.checkBTTS(fixture);
            if (checker) outcome = "GG";
        }

        return outcome;
    }

    checkNewOutcome(fixture) {
        const $label = fixture.label;

        const options = Object.values($label);

        const data = {
            [options[0]]: null ,
            [options[1]]: null
        };

        for (const fix of Object.keys(data)) {
            let outcome = "";
            if (fix === "1") {
                const checker = this.checkWin(fixture, "1");
                if (checker) outcome = fix;
            } else if (fix === "2") {
                const checker = this.checkWin(fixture, "2");
                if (checker) outcome = fix;
            } else if (fix === "X") {
                const checker = this.checkDraw(fixture);
                if (checker) outcome = fix;
            } else if (fix === "GG") {
                const checker = this.checkBTTS(fixture);
                if (checker) outcome = fix;
            } else if (fix === "Ov. 2.5") {
                const checker = this.checkOver2_5(fixture);
                if (checker) outcome = fix;
            } else if (fix === "Un. 2.5") {
                const checker = this.checkUnder2_5(fixture);
                if (checker) outcome = fix;
            } else if (fix === "Ov. 3.5") {
                const checker = this.checkOver3_5(fixture);
                if (checker) outcome = fix;
            }

            data[fix] = outcome;
        }

        return data;
    }

    checkBTTS($scores) {
        return $scores.scores.home > 0 && $scores.scores.away > 0;
    }

    checkWin($scores, team) {
        if (team === "1") return $scores.scores.home > $scores.scores.away;
        return $scores.scores.away > $scores.scores.home;
    }

    checkDraw($scores) {
        return $scores.scores.home === $scores.scores.away;
    }

    checkWinOrDraw($scores, team) {
        if (team === "1X") return $scores.scores.home >= $scores.scores.away;
        return $scores.scores.away >= $scores.scores.home;
    }

    checkOver2_5($scores) {
        return $scores.scores.home + $scores.scores.away >= 3;
    }

    checkOver3_5($scores) {
        return $scores.scores.home + $scores.scores.away >= 4;
    }

    checkUnder2_5($scores) {
        return $scores.scores.home + $scores.scores.away <= 2;
    }

    checkUnder3_5($scores) {
        return $scores.scores.home + $scores.scores.away <= 3;
    }

    getAllHomeAwayWin() {
        return this.$predictions.filter((fixture) => fixture.label.winOrDraw === "1" || fixture.label.winOrDraw === "2");
    }

    get3GameBundlePredictions() {
        return this.$predictions.filter((fixture) => fixture.label.winOrDraw === "1" || fixture.label.winOrDraw === "2" || fixture.label.otherOption === "over_2_5" || fixture.label.otherOption === "under_2_5" || fixture.label.otherOption === "gg");
    }

    removePaidPredictions() {
        return this.$predictions.sort((a, b) => {
            const checkA = a.predictions;
            const checkB = b.predictions;

            let sumOfA = 0;
            let sumOfB = 0;

            for (const probA of Object.values(checkA)) {
                sumOfA += probA;
            }

            for (const probB of Object.values(checkB)) {
                sumOfB += probB;
            }
            return sumOfB - sumOfA
        }).slice(0, 5);
    }
}

module.exports = Prediction;
