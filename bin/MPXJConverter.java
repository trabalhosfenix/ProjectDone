import net.sf.mpxj.ProjectFile;
import net.sf.mpxj.Task;
import net.sf.mpxj.Resource;
import net.sf.mpxj.Relation;
import net.sf.mpxj.reader.UniversalProjectReader;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.List;

/**
 * MPXJ Converter - Converte arquivos MS Project para JSON
 * Uso: java -jar mpxj-converter.jar input.mpp output.json
 */
public class MPXJConverter {

    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Uso: java -jar mpxj-converter.jar <input.mpp> <output.json>");
            System.exit(1);
        }

        String inputPath = args[0];
        String outputPath = args[1];

        try {
            // Ler arquivo do Project
            UniversalProjectReader reader = new UniversalProjectReader();
            ProjectFile project = reader.read(new File(inputPath));

            // Converter para estrutura JSON
            ProjectData data = new ProjectData();
            data.name = project.getProjectProperties().getName();
            data.tasks = new ArrayList<>();

            for (Task task : project.getTasks()) {
                if (task.getID() == null || task.getID() == 0) continue;
                
                TaskData td = new TaskData();
                td.id = task.getID();
                td.name = task.getName();
                td.wbs = task.getWBS();
                td.start = task.getStart() != null ? task.getStart().toString() : null;
                td.finish = task.getFinish() != null ? task.getFinish().toString() : null;
                td.duration = task.getDuration() != null ? task.getDuration().toString() : null;
                td.percentComplete = task.getPercentageComplete() != null ? 
                    task.getPercentageComplete().doubleValue() : 0;
                td.milestone = task.getMilestone();
                td.summary = task.getSummary();
                td.notes = task.getNotes();

                // Recursos
                if (task.getResourceAssignments() != null && !task.getResourceAssignments().isEmpty()) {
                    StringBuilder resources = new StringBuilder();
                    task.getResourceAssignments().forEach(ra -> {
                        if (ra.getResource() != null && ra.getResource().getName() != null) {
                            if (resources.length() > 0) resources.append(";");
                            resources.append(ra.getResource().getName());
                        }
                    });
                    td.resourceNames = resources.toString();
                }

                // Predecessores
                if (task.getPredecessors() != null && !task.getPredecessors().isEmpty()) {
                    StringBuilder preds = new StringBuilder();
                    for (Relation rel : task.getPredecessors()) {
                        if (preds.length() > 0) preds.append(",");
                        preds.append(rel.getTargetTask().getID());
                        preds.append(rel.getType().toString().substring(0, 2));
                    }
                    td.predecessors = preds.toString();
                }

                data.tasks.add(td);
            }

            // Escrever JSON
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            try (FileWriter writer = new FileWriter(outputPath)) {
                gson.toJson(data, writer);
            }

            System.out.println("OK: " + data.tasks.size() + " tasks exported");

        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(2);
        }
    }

    static class ProjectData {
        String name;
        List<TaskData> tasks;
    }

    static class TaskData {
        Integer id;
        String name;
        String wbs;
        String start;
        String finish;
        String duration;
        double percentComplete;
        boolean milestone;
        boolean summary;
        String notes;
        String resourceNames;
        String predecessors;
    }
}
