console.log("HELLO");
console.log(mtData);

let questions = [];
let results = [];
const categoryOrder = Object.keys(mtData.questions);

$(document).ready(function() {
	
	//Question Objects
	categoryOrder.forEach(function (category) {	
		const categoryQuestions = Object.keys(mtData.questions[category]);	
		categoryQuestions.forEach(function (question) {
			const questionAsNumber = parseInt(question, 10) - 1;
			const answer = mtData.questions[category][question];
			questions[questionAsNumber] = { 
				answer: answer, 
				category: category, 
				answerCounts: [0, 0, 0, 0, 0, 0],
			};
		});
	});

	//Results
	let count = 0;
	mtData.rawData.forEach(function (row) {           
		const district = parseInt(row.substr(0, 1), 10);
		const school = parseInt(row.substr(1, 2), 10);
		const student = parseInt(row.substr(3, 1), 10);
		const answers = row.substr(4).split('').map(function (digit) { return parseInt(digit, 10); });         

		const validatedAnswers = answers.map(function (answer, i) {
			if (!questions[i]){ 
				return { correct: null, type: null };
			};	
			const correct = answer === questions[i].answer ? true : false;
			if(district != 0) {
				questions[i].answerCounts[answer] += 1;
			};
			return {
				correct: answer === 0 ? null : correct, 
				answer: answer,
				category: questions[i].category
			};
		});

		const correctAnswers = countAnswersByIsCorrect(true, validatedAnswers);
		const incorrectAnswers = countAnswersByIsCorrect(false, validatedAnswers);
		const answeredByCategory = categoryOrder.map(function(category) { 
			return countCorrectForCategory(category, validatedAnswers);
		});
		
		if(district != 0) {
			results[count] = {
				name: mtData.teams[district - 1].schools[school - 1].students[student - 1],
				schoolName: mtData.teams[district - 1].schools[school - 1].name,
				totalCorrect: correctAnswers,
				totalIncorrect: incorrectAnswers,
				correctByCategory: answeredByCategory,
				district: district,
				school: school,
				student: student,
				score: "0",
			};
		};
		count++;
	});
	console.log(questions);
	//printOutResults();
	tournyPost();
	
	let currentTab = $('#controlTabs').find('.active').text();
	console.log(currentTab);
	
	
	mtData.teams.forEach(function(district, i){
		$('#participating-division')
		.append(
			$('<option>')
			.attr({
				'value': i
			})
			.text(district.division)
		);
		$('#division-division')
		.append(
			$('<option>')
			.attr({
				'value': i
			})
			.text(district.division)
		);
		$('#school-division')
		.append(
			$('<option>')
			.attr({
				'value': i
			})
			.text(district.division)
		);
	});

	$('#division-division').change(function(){
		$("#divisionContainer").empty();
		let division = $('#division-division').find('option:selected').val();
		divisionPost(division);
	});
	
	$('#participating-division').change(function(){
		$("#participatingContainer").empty();
		let division = $('#participating-division').find('option:selected').val();
		postParticipating(division);
	});
	
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		currentTab = $('#controlTabs').find('.active').text();
		switch(currentTab) {
			case "Tournament":
				$('#tourneyContainer').empty();
				console.log("Tourny");
				tournyPost();
				break;
			case "Division":
				$('#divisionContainer').empty();
				console.log("District");
				divisionPost($('#division-division').find('option:selected').val());
				break;
			case "School":
				console.log("Schools");
				break;
			case "Bulk":
				$('#bulkContainer').empty();
				mainResult(totalCor() ,categoryOrder.reduce(toAverage, {}));
				console.log("Bulk");
				break;
			case "Error":
				$("#errorContainer").empty();
				postError();
				break;
			default:
				$("#participatingContainer").empty();
				postParticipating($('#participating-division').find('option:selected').val());
		};
	});
});

function tournyPost() {
	
	let allScores = [];
	results.forEach(function(current, i) {
		allScores[i] = current.score;
	});
	
	$("#tourneyContainer").append($('<center>').append($('<p>').text("*** ITEM ANALYSYS ***")));
	$("#tourneyContainer").append($('<center>').append($('<p>').text("The average of " + results.length + " scores = " + (average(allScores)).toFixed(2) + ", the standard deviation = " + (standardDeviation(allScores)).toFixed(2) + ".\n\n")));	
	$("#tourneyContainer").append($('<table>').addClass('table tourneyTable')
		.append(
			$('<thead>')
			.append(
				$('<tr>')
				.append($('<th>').text('Question'))
				.append($('<th>').text('Blanks'))
				.append($('<th>').text('First'))
				.append($('<th>').text('Second'))
				.append($('<th>').text('Third'))
				.append($('<th>').text('Fourth'))
				.append($('<th>').text('Fifth'))
				.append($('<th>').text('Category'))
				.append($('<th>').text('Percent'))
			)
		)
		.append(
			$('<tbody>')
		)
	)
	
	questions.forEach(function(current, i) {
		$("#tourneyContainer").find('table.tourneyTable tbody')
		.append(
			$('<tr>')
			.append($('<td>').text(i + 1))
			.append($('<td>').text(current.answerCounts[0]))
			.append($('<td>').text(current.answerCounts[1]))
			.append($('<td>').text(current.answerCounts[2]))
			.append($('<td>').text(current.answerCounts[3]))
			.append($('<td>').text(current.answerCounts[4]))
			.append($('<td>').text(current.answerCounts[5]))
			.append($('<td>').text(current.category))
			.append($('<td>').text((current.answerCounts[current.answer] / results.length * 100).toFixed(2)))
		)
	})
	return;
};
function divisionPost(division) {
	
	let ranking = [];
	let schoolRanking = [];
	
	mtData.teams[division].schools.forEach(function(school, schoolNum) {
		let schoolSRanking = [];
		school.students.forEach(function(student, studentNum) {
			let isPresent = false;
			let rPos = 0;
			results.forEach(function(resultList, rNum) {
				if(student == resultList.name){
					isPresent = true;
					rPos = rNum;
				};
			});
			if(isPresent == true) {
				ranking.push({
					name: student,
					school: school.name,
					score: results[rPos].score,
				});
				schoolSRanking.push({
					name: student,
					school: school.name,
					score: results[rPos].score,
				});
			};
			if(isPresent == false) {
				ranking.push({
					name:student,
					school: school.name,
					score: 0,
				});
				schoolSRanking.push({
					name: student,
					school: school.name,
					score: results[rPos].score,
				});
			};
		});
		schoolSRanking = schoolSRanking.sort(function (a, b) {
			return a.score - b.score;
		});
		schoolSRanking = schoolSRanking.reverse();
		
		if(schoolSRanking.length >= 4) {
			schoolRanking.push({
				school: school.name,
				top4Score: (schoolSRanking[0].score + schoolSRanking[1].score + schoolSRanking[2].score + schoolSRanking[3].score)
			})
		}
		else {
			let top4Temp = 0;
			schoolSRanking.forEach(function(current) {
				top4Temp += current.score;
			})
			schoolRanking.push({
				school: school.name,
				top4Score: top4Temp
			})
		}

	});
	
	ranking = ranking.sort(function (a, b) {
		return a.score - b.score;
	});
	ranking = ranking.reverse();
	schoolRanking = schoolRanking.sort(function (a, b) {
		return a.score - b.score;
	});
	schoolRanking = schoolRanking.reverse();
	
	$("#divisionContainer").append($('<table>').addClass('table divisionSchoolTable')
		.append(
			$('<thead>')
			.append(
				$('<tr>')
				.append($('<th>').text('Rank'))
				.append($('<th>').text('School'))
				.append($('<th>').text('Top 4 Scores'))
			)
		)
		.append(
			$('<tbody>')
		)
	)
	schoolRanking.forEach(function(current, i) {
		$("#divisionContainer").find('table.divisionSchoolTable tbody')
		.append(
			$('<tr>')
			.append($('<td>').text(i + 1))
			.append($('<td>').text(current.school))
			.append($('<td>').text(current.top4Score))
		)
	})
	
	$("#divisionContainer").append($('<table>').addClass('table divisionTable')
		.append(
			$('<thead>')
			.append(
				$('<tr>')
				.append($('<th>').text('Rank'))
				.append($('<th>').text('Student'))
				.append($('<th>').text('School'))
				.append($('<th>').text('Score'))
			)
		)
		.append(
			$('<tbody>')
		)
	)

	ranking.forEach(function(current, i) {
		if(current.score > 0) {
			$("#divisionContainer").find('table.divisionTable tbody')
			.append(
				$('<tr>')
				.append($('<td>').text(i + 1))
				.append($('<td>').text(current.name))
				.append($('<td>').text(current.school))
				.append($('<td>').text(current.score))
			)
		}
	})
	return;
};

function postParticipating(division) {
	try {
		mtData.teams[division].schools.forEach(function(school, i) {
			school.students.forEach(function(student, j) {
				$("#participatingContainer").append(
					$('<p>')
					.text(((parseInt(division, 10) + 1) * 1000) + ((i + 1) * 10) + (j + 1) + ",\t\t"+ student + ",\t\t" + school.name + "\n")
				);
			});
		});
	}
	catch(err) {
	}
	return;
};

function countCorrectForCategory(category, answers) {
	const answersForCategory = filterAnswersByCategory(category, answers);
	return countAnswersByIsCorrect(true, answersForCategory);
};

function filterAnswersByCategory(category, answers) {
	let filteredList = [];
	answers.forEach(function(answer) {
		if (answer.category === category) {
			filteredList.push(answer);
		};
	});
	return filteredList;
};

function countAnswersByIsCorrect(isCorrect, answers) {
	let temp = 0;

	answers.forEach(function (answer) {
		if (answer.correct === null) return;
		if (answer.correct === isCorrect) {
			temp += 1;
			return;
		};
	});

	return temp;
};

function printOutResults() {
	console.log(postError());
	console.log(mainResult(totalCor() ,categoryOrder.reduce(toAverage, {})));
};

function getTeamScores(districtNum, schoolNum) {
	let scoreArray = [];
	let iPCount = 0;
	mtData.teams[districtNum].schools[schoolNum].students.forEach(function(student, studentNum) {
		let isPresent = false;
		let rPos = 0;
		results.forEach(function(resultList, rNum) {
			if(student == resultList.name){
				isPresent = true;
				rPos = rNum;
			};
		});
		if(isPresent == true) {
			scoreArray[iPCount] = (4 * (results[rPos].totalCorrect)) - results[rPos].totalIncorrect + 40;
			results[rPos].score = scoreArray[iPCount];
			iPCount++;
		};
	});
	let largest = sortArray(scoreArray);
	if(largest.length >= 4) {
		largest = largest[0] + largest[1] + largest[2] + largest[3];
	}
	else {
		tLargest = 0;
		for(i = 0; i < largest.length; i++) {
			if(largest[i] > 0) {
				tLargest += largest[i];
			};
		};
		largest = tLargest;
	}
	return [largest, scoreArray];
};

function sortArray(scoreByPattern){
    scoreByPattern.sort(function(a,b) {
        if (a < b) { return 1; }
        else if (a == b) { return 0; }
        else { return -1; }
    });
	return scoreByPattern;
};

function toAverage(memo, categoryName) {
    const total = Object.keys(mtData.questions[categoryName]).length * results.length;
    const totalCorrect = results.reduce(function(memo, result) {
        return memo + result.correctByCategory[categoryOrder.indexOf(categoryName)];
    }, 0);
    memo[categoryName] = ((totalCorrect/total) * 100).toFixed(2);
	return memo;
};

function totalCor() {
	const totCor = results.reduce(function(total, cur) {
		return total + cur.totalCorrect;
	}, 0);
	return (((totCor / questions.length) / results.length) * 100).toFixed(2);
};

function standardDeviation(values) {

	const avg = average(values);
  
	const squareDiffs = values.map(function(value) {
		const diff = value - avg;
		const sqrDiff = diff * diff;
		return sqrDiff;
	});

	return Math.sqrt(average(squareDiffs));
};

function average(data) {
	let sum = data.reduce(function(sum, value) {
		return sum + value;
	}, 0);

	return sum / data.length;
};

function postError() {
	mtData.teams.forEach(function(district, districtNum) {
		district.schools.forEach(function(school, schoolNum) {
			school.students.forEach(function(student, studentNum) {
				let fCount = 0;
				results.forEach(function(rStudents) {
					if(rStudents.name != student) {
						fCount++;
					};
				});
				if(fCount == results.length) {
					$("#errorContainer").append(
						$('<p>')
						.text("WARNING: No EXAM turned in for student # " + (studentNum + 1) +" from school # " + (schoolNum + 1) + " in division # " + (districtNum + 1) + "\n"));
				};
			});
		});
	});
	return;
};

function mainResult(totalCor, catCor) {
	let comResult = "VERSION Q (2013 - _final_ version)\nBREAK\n";
	let catKeys = Object.keys(catCor);
	mtData.teams.forEach(function(district, districtNum) {
		district.schools.forEach(function(school, schoolNum) {
			const scoreArray = getTeamScores(districtNum, schoolNum);
			comResult += "GSW Mathematics Tournament " + mtData.date + " -Georgia Southwestern State University-\nSchool:  " + school.name + "\n\n";
			comResult += "	The SCORE is computer using the formula 4C - I + 40, where C represents\nthe number of correct responses and I represents the number of incorrect\n responses. Blank responses do not affect the score. The table below shows\nonly the score and the number correct. If you desire the number incorrect\n and the number left blank, you will have to deduce them from the scoring\nformula.\n\n	We enjoyed having you as part of our activites today and hope that you\nfound this to be a rewarding learning experience. We look forward to seeing\nyou at Georgia Southwestern at our other competitions and visitations during\nthe year.\n\n\n	***          ***          ***          ***          ***          ***\n\n\nThe following results are based upon all " + results.length + " participants.\n\n\nTournament-wide results by category:  (Percent correct)\n\n";
			comResult += "Algebra:  " + catCor[catKeys[0]] + "   Analytic Geometry: " + catCor[catKeys[1]] + " Geometry:     " + catCor[catKeys[2]] + "\nTrigonometry: " + catCor[catKeys[3]] + "   Miscellaneous:     " + catCor[catKeys[4]] + "  Overall average:  " + totalCor + "\n\n";
			comResult += "                                     SCHOOL:  " + school.name + "\n                                         Division #" + (districtNum + 1) + ", School #" + (schoolNum + 1) + "\n\n";
			comResult += "                                                  TOP 4 TOTAL  " + scoreArray[0] + "\n\n";
			comResult += "                                              CIPHERING TOTAL  ________\n\n                                                  MATCH TOTAL  ________\n\n";
			comResult += "Individual results on the multiple choice exam:\n\nSTUDENT NAME		SCORE	    ALGE	    ANGE	    GEOM	    TRIG	    MISC	   TOTAL\n";
			let cPos = 0;
			mtData.teams[districtNum].schools[schoolNum].students.forEach(function(student, studentNum) {
				let isPresent = false;
				let rPos = 0;
				results.forEach(function(resultList, rNum) {
					if(student == resultList.name){
						isPresent = true;
						rPos = rNum;
					};
				});
				if(isPresent == true) {
					comResult += (studentNum + 1) + "\t\t\t" + results[rPos].name + "\t\t" + results[rPos].score + "\t\t";
					results[rPos].correctByCategory.forEach(function(categoricalCorrect, catCount) {
						comResult += categoricalCorrect + "/" + Object.keys(mtData.questions[Object.keys(mtData.questions)[catCount]]).length + "\t\t";
					});
					comResult += results[rPos].totalCorrect + "/" + questions.length + "\n";
				};
			});
			comResult += "BREAK\n";
		});
	});
	mtData.teams.forEach(function(district, districtNum) {
		let ranking = [];
		district.schools.forEach(function(school, schoolNum) {
			mtData.teams[districtNum].schools[schoolNum].students.forEach(function(student, studentNum) {
				let isPresent = false;
				let rPos = 0;
				results.forEach(function(resultList, rNum) {
					if(student == resultList.name){
						isPresent = true;
						rPos = rNum;
					};
				});
				if(isPresent == true) {
					ranking.push({
						name: student,
						school: school.name,
						score: results[rPos].score,
					});
				};
				if(isPresent == false) {
					ranking.push({
						name:student,
						school: school.name,
						score: 0,
					});
				};
			});
		
		});
		ranking = ranking.sort(function (a, b) {
			return a.score - b.score;
		});
		ranking = ranking.reverse();
		comResult += "GSW Mathematics Tournament " + mtData.date + " -Georgia Southwestern State University-\n\n";
		comResult += "STUDENT RANKINGS: Division: " + (districtNum + 1) + " :\n\n";
		comResult += "RANK  NAME                 SCORE   SCHOOL\n\n";
		ranking.forEach(function(rank, rankNum) {
			comResult += (rankNum + 1) + "\t" + rank.name + "\t" + rank.score + "\t" + rank.school + "\n";
		});
		let districtAverage = 0;
		let totalAve = 0;
		let stdDevData = [];
		ranking.forEach(function(rank, rankNum) {
			if(rank.score != 0) {
				districtAverage += rank.score;
				totalAve += 1;
			};
			stdDevData[rankNum] = rank.score;
		});
		
		stdDevData = stdDevData.filter(function(val) {
			return val !== 0;
		});
		
		comResult += "\nAverage of " + totalAve + " scores =  " + (districtAverage / totalAve).toFixed(2) + ", Standard Deviation = " + standardDeviation(stdDevData).toFixed(2) + "\n";
		
		
	});
	
	let allScores = [];
	results.forEach(function(current, i) {
		allScores[i] = current.score;
	});
	console.log(allScores);
	comResult += "BREAK\nGSW Mathematics Tournament " + mtData.date + " -Georgia Southwestern State University-\n\n";
	comResult += "*** ITEM ANALYSYS ***\n\n";
	comResult += "The average of " + results.length + " scores = " + (average(allScores)).toFixed(2) + ", the standard deviation = " + (standardDeviation(allScores)).toFixed(2) + ".\n\n";
	comResult += "Number of questions per category:\nALGE " + Object.keys(mtData.questions['ALGE']).length + " :	ANGE " + Object.keys(mtData.questions['ANGE']).length + " :	GEOM " + Object.keys(mtData.questions['GEOM']).length + " :	TRIG " + Object.keys(mtData.questions['TRIG']).length + " :	MISC " + Object.keys(mtData.questions['MISC']).length + " :\n\n";
	comResult += "Question Blanks First  Second Third  Fourth Fifth  Other   Type    Percent";
	questions.forEach(function(current, i) {
		comResult += "\n" + (i + 1);
		current.answerCounts.forEach(function(count, j) {
			comResult += "\t";
			if (current.answer == j) {
				comResult += "*";
			};
			comResult += count;
		});
	});
	console.log(comResult);
	$('#bulkContainer').text(comResult);
	return;
};